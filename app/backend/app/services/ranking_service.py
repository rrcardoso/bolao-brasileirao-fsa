import logging

from sqlalchemy.orm import Session

from ..config import settings
from ..models import Apostador, Palpite, Team
from ..schemas import RankingEntry, RankingResponse
from ..services.session_utils import brasilia_datetime_str

logger = logging.getLogger("bolao.ranking")


def build_ranking(db: Session) -> RankingResponse:
    teams = {t.sofascore_id: t for t in db.query(Team).all()}
    team_by_pk = {t.id: t for t in teams.values()}
    apostadores = db.query(Apostador).all()

    if not apostadores:
        return RankingResponse(
            updated_at=brasilia_datetime_str(),
            display_column=settings.DISPLAY_COLUMN,
            entries=[],
        )

    rows: list[dict] = []
    for ap in apostadores:
        palpites = sorted(ap.palpites, key=lambda p: p.prioridade)
        pontos: list[int] = []
        nomes: list[str] = []
        codes: list[str] = []
        team_ids: list[int] = []
        team_positions: list[int] = []
        total = 0

        for i in range(settings.TIMES_PER_APOSTADOR):
            if i < len(palpites):
                team = team_by_pk.get(palpites[i].team_id)
                pts = team.points if team else 0
                name = team.name if team else f"ID:{palpites[i].team_id}"
                code = team.name_code if team else ""
                sf_id = team.sofascore_id if team else 0
                pos = team.position if team else 0
                pontos.append(pts)
                nomes.append(name)
                codes.append(code)
                team_ids.append(sf_id)
                team_positions.append(pos)
                total += pts
            else:
                pontos.append(0)
                nomes.append("")
                codes.append("")
                team_ids.append(0)
                team_positions.append(0)

        rows.append(
            {
                "apostador": ap.nome,
                "ordem_inscricao": ap.ordem_inscricao,
                "total": total,
                "pontos": pontos,
                "times": nomes,
                "times_codes": codes,
                "team_ids": team_ids,
                "team_positions": team_positions,
            }
        )

    rows.sort(key=_sort_key)

    entries = [
        RankingEntry(
            rank=idx + 1,
            apostador=r["apostador"],
            ordem_inscricao=r["ordem_inscricao"],
            total=r["total"],
            pontos=r["pontos"],
            times=r["times"],
            times_codes=r["times_codes"],
            team_ids=r["team_ids"],
            team_positions=r["team_positions"],
        )
        for idx, r in enumerate(rows)
    ]

    return RankingResponse(
        updated_at=brasilia_datetime_str(),
        display_column=settings.DISPLAY_COLUMN,
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
