import logging

from sqlalchemy.orm import Session

from ..config import settings
from ..models import Team
from . import sofascore
from .session_utils import brasilia_now

logger = logging.getLogger("bolao.sync")


async def sync_standings(db: Session) -> list[dict]:
    standings = await sofascore.fetch_standings()

    if len(standings) < settings.MIN_TEAMS_PROTECTION:
        raise RuntimeError(
            f"Proteção: apenas {len(standings)} times retornados "
            f"(mínimo: {settings.MIN_TEAMS_PROTECTION}). Dados não atualizados."
        )

    for row in standings:
        team = db.query(Team).filter(Team.sofascore_id == row["teamId"]).first()
        if team:
            team.name = row["teamName"]
            team.slug = row["teamSlug"]
            team.name_code = row["teamNameCode"]
            team.position = row["position"]
            team.points = row["points"]
            team.matches = row["matches"]
            team.wins = row["wins"]
            team.draws = row["draws"]
            team.losses = row["losses"]
            team.goals_for = row["scoresFor"]
            team.goals_against = row["scoresAgainst"]
            team.updated_at = brasilia_now()
        else:
            team = Team(
                sofascore_id=row["teamId"],
                name=row["teamName"],
                slug=row["teamSlug"],
                name_code=row["teamNameCode"],
                position=row["position"],
                points=row["points"],
                matches=row["matches"],
                wins=row["wins"],
                draws=row["draws"],
                losses=row["losses"],
                goals_for=row["scoresFor"],
                goals_against=row["scoresAgainst"],
            )
            db.add(team)

    db.commit()
    logger.info("Sync: %d times atualizados.", len(standings))
    return standings
