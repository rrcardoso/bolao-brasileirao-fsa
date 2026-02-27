from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_admin
from ..config import settings
from ..database import get_db
from ..models import Apostador, Palpite, Team
from ..schemas import ApostadorCreate, ApostadorOut, ApostadorUpdate, ImportResult

router = APIRouter()


@router.get("", response_model=list[ApostadorOut])
def list_apostadores(db: Session = Depends(get_db)):
    return (
        db.query(Apostador).order_by(Apostador.ordem_inscricao).all()
    )


@router.post("", response_model=ApostadorOut, status_code=201)
def create_apostador(
    data: ApostadorCreate,
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    existing = (
        db.query(Apostador)
        .filter(Apostador.nome.ilike(data.nome.strip()))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f'Apostador "{data.nome}" já está cadastrado.',
        )

    ordem_exists = (
        db.query(Apostador)
        .filter(Apostador.ordem_inscricao == data.ordem_inscricao)
        .first()
    )
    if ordem_exists:
        raise HTTPException(
            status_code=409,
            detail=f"Ordem de inscrição {data.ordem_inscricao} já está em uso por {ordem_exists.nome}.",
        )

    if len(data.palpites) != settings.TIMES_PER_APOSTADOR:
        raise HTTPException(
            status_code=422,
            detail=f"Esperado {settings.TIMES_PER_APOSTADOR} palpites, recebido {len(data.palpites)}.",
        )

    team_ids = [p.team_id for p in data.palpites]
    if len(set(team_ids)) != len(team_ids):
        raise HTTPException(status_code=422, detail="Times duplicados.")

    prioridades = [p.prioridade for p in data.palpites]
    expected = set(range(1, settings.TIMES_PER_APOSTADOR + 1))
    if set(prioridades) != expected:
        raise HTTPException(
            status_code=422,
            detail=f"Prioridades devem ser de 1 a {settings.TIMES_PER_APOSTADOR}.",
        )

    for p in data.palpites:
        team = db.query(Team).filter(Team.sofascore_id == p.team_id).first()
        if not team:
            raise HTTPException(
                status_code=422,
                detail=f"Team com sofascore_id {p.team_id} não encontrado. Execute sync primeiro.",
            )

    apostador = Apostador(
        nome=data.nome.strip(),
        ordem_inscricao=data.ordem_inscricao,
    )
    db.add(apostador)
    db.flush()

    for p in data.palpites:
        team = db.query(Team).filter(Team.sofascore_id == p.team_id).first()
        db.add(
            Palpite(
                apostador_id=apostador.id,
                team_id=team.id,
                prioridade=p.prioridade,
            )
        )

    db.commit()
    db.refresh(apostador)
    return apostador


@router.post("/import", response_model=ImportResult)
def import_apostadores(
    items: list[ApostadorCreate],
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    created = 0
    skipped = 0
    errors: list[str] = []

    for data in items:
        nome = data.nome.strip()

        existing = (
            db.query(Apostador)
            .filter(Apostador.nome.ilike(nome))
            .first()
        )
        if existing:
            skipped += 1
            continue

        ordem_exists = (
            db.query(Apostador)
            .filter(Apostador.ordem_inscricao == data.ordem_inscricao)
            .first()
        )
        if ordem_exists:
            errors.append(
                f'"{nome}": ordem {data.ordem_inscricao} já em uso por {ordem_exists.nome}.'
            )
            continue

        if len(data.palpites) != settings.TIMES_PER_APOSTADOR:
            errors.append(
                f'"{nome}": esperado {settings.TIMES_PER_APOSTADOR} palpites, recebido {len(data.palpites)}.'
            )
            continue

        team_ids = [p.team_id for p in data.palpites]
        if len(set(team_ids)) != len(team_ids):
            errors.append(f'"{nome}": times duplicados.')
            continue

        expected_prios = set(range(1, settings.TIMES_PER_APOSTADOR + 1))
        if set(p.prioridade for p in data.palpites) != expected_prios:
            errors.append(
                f'"{nome}": prioridades devem ser de 1 a {settings.TIMES_PER_APOSTADOR}.'
            )
            continue

        team_map: dict[int, Team] = {}
        valid = True
        for p in data.palpites:
            team = db.query(Team).filter(Team.sofascore_id == p.team_id).first()
            if not team:
                errors.append(
                    f'"{nome}": team sofascore_id {p.team_id} não encontrado. Execute sync primeiro.'
                )
                valid = False
                break
            team_map[p.team_id] = team

        if not valid:
            continue

        apostador = Apostador(nome=nome, ordem_inscricao=data.ordem_inscricao)
        db.add(apostador)
        db.flush()

        for p in data.palpites:
            db.add(
                Palpite(
                    apostador_id=apostador.id,
                    team_id=team_map[p.team_id].id,
                    prioridade=p.prioridade,
                )
            )

        created += 1

    db.commit()
    return ImportResult(created=created, skipped=skipped, errors=errors)


@router.put("/{apostador_id}", response_model=ApostadorOut)
def update_apostador(
    apostador_id: int,
    data: ApostadorUpdate,
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    apostador = db.query(Apostador).get(apostador_id)
    if not apostador:
        raise HTTPException(status_code=404, detail="Apostador não encontrado.")

    if data.nome is not None:
        conflict = (
            db.query(Apostador)
            .filter(Apostador.nome.ilike(data.nome.strip()), Apostador.id != apostador_id)
            .first()
        )
        if conflict:
            raise HTTPException(status_code=409, detail=f'Nome "{data.nome}" já está em uso.')
        apostador.nome = data.nome.strip()

    if data.ordem_inscricao is not None:
        conflict = (
            db.query(Apostador)
            .filter(
                Apostador.ordem_inscricao == data.ordem_inscricao,
                Apostador.id != apostador_id,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=409,
                detail=f"Ordem {data.ordem_inscricao} já está em uso por {conflict.nome}.",
            )
        apostador.ordem_inscricao = data.ordem_inscricao

    if data.palpites is not None:
        if len(data.palpites) != settings.TIMES_PER_APOSTADOR:
            raise HTTPException(
                status_code=422,
                detail=f"Esperado {settings.TIMES_PER_APOSTADOR} palpites.",
            )

        team_ids = [p.team_id for p in data.palpites]
        if len(set(team_ids)) != len(team_ids):
            raise HTTPException(status_code=422, detail="Times duplicados.")

        expected = set(range(1, settings.TIMES_PER_APOSTADOR + 1))
        if set(p.prioridade for p in data.palpites) != expected:
            raise HTTPException(
                status_code=422,
                detail=f"Prioridades devem ser de 1 a {settings.TIMES_PER_APOSTADOR}.",
            )

        for p in data.palpites:
            team = db.query(Team).filter(Team.sofascore_id == p.team_id).first()
            if not team:
                raise HTTPException(
                    status_code=422,
                    detail=f"Team sofascore_id {p.team_id} não encontrado.",
                )

        db.query(Palpite).filter(Palpite.apostador_id == apostador.id).delete()
        db.flush()

        for p in data.palpites:
            team = db.query(Team).filter(Team.sofascore_id == p.team_id).first()
            db.add(
                Palpite(
                    apostador_id=apostador.id,
                    team_id=team.id,
                    prioridade=p.prioridade,
                )
            )

    db.commit()
    db.refresh(apostador)
    return apostador


@router.delete("/{apostador_id}", status_code=204)
def delete_apostador(
    apostador_id: int,
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    apostador = db.query(Apostador).get(apostador_id)
    if not apostador:
        raise HTTPException(status_code=404, detail="Apostador não encontrado.")
    db.delete(apostador)
    db.commit()
