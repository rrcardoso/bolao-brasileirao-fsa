import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_admin
from ..config import settings
from ..database import get_db
from ..models import Apostador
from ..schemas import ConfigOut, SyncResponse
from ..services import badges_service, historico_service, sync_service

logger = logging.getLogger("bolao.admin")
router = APIRouter()


@router.post("/sync", response_model=SyncResponse)
async def sync_data(
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    try:
        standings = await sync_service.sync_standings(db)
    except RuntimeError as e:
        logger.error("Sync falhou: %s", e)
        raise HTTPException(status_code=502, detail=str(e))

    team_ids = [s["teamId"] for s in standings]
    badges_downloaded = await badges_service.download_all_badges(team_ids)

    apostadores_count = db.query(Apostador).count()
    session_key = None
    if apostadores_count > 0:
        session_key = historico_service.record_snapshot(db)

    badge_msg = f", {badges_downloaded} escudos novos" if badges_downloaded else ""
    return SyncResponse(
        teams_count=len(standings),
        apostadores_count=apostadores_count,
        historico_session=session_key,
        message=f"Sync OK: {len(standings)} times atualizados{badge_msg}.",
    )


@router.get("/config", response_model=ConfigOut)
def get_config(_admin: str = Depends(get_current_admin)):
    return ConfigOut(
        season_year=settings.SEASON_YEAR,
        tournament_id=settings.TOURNAMENT_ID,
        season_id=settings.SEASON_ID,
        times_per_apostador=settings.TIMES_PER_APOSTADOR,
        min_teams_protection=settings.MIN_TEAMS_PROTECTION,
        display_column=settings.DISPLAY_COLUMN,
    )


@router.api_route("/cron/sync", methods=["GET", "POST"], response_model=SyncResponse)
async def cron_sync(
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    if token != settings.CRON_SECRET:
        raise HTTPException(status_code=403, detail="Token inválido.")

    try:
        standings = await sync_service.sync_standings(db)
    except RuntimeError as e:
        logger.error("Cron sync falhou: %s", e)
        raise HTTPException(status_code=502, detail=str(e))

    team_ids = [s["teamId"] for s in standings]
    badges_downloaded = await badges_service.download_all_badges(team_ids)

    apostadores_count = db.query(Apostador).count()
    session_key = None
    if apostadores_count > 0:
        session_key = historico_service.record_snapshot(db)

    badge_msg = f", {badges_downloaded} escudos novos" if badges_downloaded else ""
    return SyncResponse(
        teams_count=len(standings),
        apostadores_count=apostadores_count,
        historico_session=session_key,
        message=f"Cron sync OK: {len(standings)} times atualizados{badge_msg}.",
    )
