from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Apostador, Snapshot
from ..schemas import SnapshotOut

router = APIRouter()


@router.get("", response_model=list[SnapshotOut])
def get_historico(
    apostador: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(
            Snapshot.session_date,
            Snapshot.rodada,
            Apostador.nome.label("apostador"),
            Snapshot.pontuacao,
            Snapshot.rank,
        )
        .join(Apostador, Snapshot.apostador_id == Apostador.id)
        .order_by(Snapshot.session_date, Snapshot.rank)
    )

    if apostador:
        query = query.filter(Apostador.nome.ilike(f"%{apostador}%"))

    rows = query.all()
    return [
        SnapshotOut(
            session_date=r.session_date,
            rodada=r.rodada,
            apostador=r.apostador,
            pontuacao=r.pontuacao,
            rank=r.rank,
        )
        for r in rows
    ]
