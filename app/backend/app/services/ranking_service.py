import logging

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Apostador, Palpite, Snapshot, Team
from ..schemas import RankingEntry, RankingResponse
from .session_utils import get_session_date

logger = logging.getLogger("bolao.ranking")

BRT_FORMAT = "%d/%m/%Y às %H:%M (Brasília)"


def _get_last_sync_time(db: Session) -> str:
    last = db.query(func.max(Team.updated_at)).scalar()
    if last:
        return last.strftime(BRT_FORMAT)
    return "Sem dados"


def _get_previous_snapshot(db: Session) -> dict[int, Snapshot]:
    """Return a map of apostador_id -> Snapshot from the most recent previous session."""
    current_session = get_session_date()
    prev_date = (
        db.query(Snapshot.session_date)
        .filter(Snapshot.session_date < current_session)
        .order_by(desc(Snapshot.session_date))
        .first()
    )
    if not prev_date:
        return {}

    snapshots = (
        db.query(Snapshot)
        .filter(Snapshot.session_date == prev_date[0])
        .all()
    )
    return {s.apostador_id: s for s in snapshots}


def build_ranking(db: Session) -> RankingResponse:
    teams = {t.sofascore_id: t for t in db.query(Team).all()}
    team_by_pk = {t.id: t for t in teams.values()}
    apostadores = db.query(Apostador).all()

    updated_at = _get_last_sync_time(db)

    max_matches_val = db.query(func.max(Team.matches)).scalar()

    if not apostadores:
        return RankingResponse(
            updated_at=updated_at,
            display_column=settings.DISPLAY_COLUMN,
            rodada=max_matches_val or 0,
            entries=[],
        )

    prev_snapshots = _get_previous_snapshot(db)
    ap_id_map = {ap.nome: ap.id for ap in apostadores}

    rows: list[dict] = []
    for ap in apostadores:
        palpites = sorted(ap.palpites, key=lambda p: p.prioridade)
        pontos: list[int] = []
        nomes: list[str] = []
        codes: list[str] = []
        team_ids: list[int] = []
        team_positions: list[int] = []
        total = 0
        total_jogos = 0

        for i in range(settings.TIMES_PER_APOSTADOR):
            if i < len(palpites):
                team = team_by_pk.get(palpites[i].team_id)
                pts = team.points if team else 0
                name = team.name if team else f"ID:{palpites[i].team_id}"
                code = team.name_code if team else ""
                sf_id = team.sofascore_id if team else 0
                pos = team.position if team else 0
                matches = team.matches if team else 0
                pontos.append(pts)
                nomes.append(name)
                codes.append(code)
                team_ids.append(sf_id)
                team_positions.append(pos)
                total += pts
                total_jogos += matches
            else:
                pontos.append(0)
                nomes.append("")
                codes.append("")
                team_ids.append(0)
                team_positions.append(0)

        media_pontos = round(total / total_jogos, 2) if total_jogos > 0 else 0.0
        aproveitamento = round((total / (total_jogos * 3)) * 100, 2) if total_jogos > 0 else 0.0

        rows.append(
            {
                "apostador": ap.nome,
                "ordem_inscricao": ap.ordem_inscricao,
                "total": total,
                "total_jogos": total_jogos,
                "media_pontos": media_pontos,
                "aproveitamento": aproveitamento,
                "pontos": pontos,
                "times": nomes,
                "times_codes": codes,
                "team_ids": team_ids,
                "team_positions": team_positions,
            }
        )

    rows.sort(key=_sort_key)

    entries = []
    for idx, r in enumerate(rows):
        current_rank = idx + 1
        ap_id = ap_id_map.get(r["apostador"])
        prev = prev_snapshots.get(ap_id) if ap_id else None

        delta_pontos = r["total"] - prev.pontuacao if prev else None
        delta_rank = prev.rank - current_rank if prev else None

        entries.append(
            RankingEntry(
                rank=current_rank,
                apostador=r["apostador"],
                ordem_inscricao=r["ordem_inscricao"],
                total=r["total"],
                total_jogos=r["total_jogos"],
                media_pontos=r["media_pontos"],
                aproveitamento=r["aproveitamento"],
                delta_pontos=delta_pontos,
                delta_rank=delta_rank,
                pontos=r["pontos"],
                times=r["times"],
                times_codes=r["times_codes"],
                team_ids=r["team_ids"],
                team_positions=r["team_positions"],
            )
        )

    return RankingResponse(
        updated_at=updated_at,
        display_column=settings.DISPLAY_COLUMN,
        rodada=max_matches_val or 0,
        entries=entries,
    )


def _sort_key(row: dict):
    """
    Desempate: total (desc), pontos prioridade 1..7 (desc), ordem inscrição (asc).
    Negate numeric values for descending sort.
    """
    key = [-row["total"]]
    for pts in row["pontos"]:
        key.append(-pts)
    key.append(row["ordem_inscricao"])
    return tuple(key)
