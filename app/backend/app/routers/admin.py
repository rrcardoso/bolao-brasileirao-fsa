import asyncio
import logging
import traceback

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

CRON_SYNC_RETRIES = 2
CRON_RETRY_DELAY = 10.0


async def _run_sync(db: Session, source: str) -> SyncResponse:
    try:
        standings = await sync_service.sync_standings(db)
    except Exception as e:
        logger.error("%s — sync_standings falhou: %s\n%s", source, e, traceback.format_exc())
        raise HTTPException(status_code=502, detail=f"Sync falhou: {e}")

    try:
        team_ids = [s["teamId"] for s in standings]
        badges_downloaded = await badges_service.download_all_badges(team_ids)
    except Exception as e:
        logger.warning("%s — badges falhou (não-crítico): %s", source, e)
        badges_downloaded = 0

    apostadores_count = db.query(Apostador).count()
    session_key = None
    if apostadores_count > 0:
        try:
            session_key = historico_service.record_snapshot(db)
        except Exception as e:
            logger.error("%s — record_snapshot falhou: %s\n%s", source, e, traceback.format_exc())

    badge_msg = f", {badges_downloaded} escudos novos" if badges_downloaded else ""
    msg = f"{source} OK: {len(standings)} times atualizados{badge_msg}."
    logger.info(msg)
    return SyncResponse(
        teams_count=len(standings),
        apostadores_count=apostadores_count,
        historico_session=session_key,
        message=msg,
    )


@router.post("/sync", response_model=SyncResponse)
async def sync_data(
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    return await _run_sync(db, "Sync")


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

    last_error = None
    for attempt in range(CRON_SYNC_RETRIES + 1):
        try:
            return await _run_sync(db, f"Cron sync (tentativa {attempt + 1})")
        except HTTPException as e:
            last_error = e
            if attempt < CRON_SYNC_RETRIES:
                logger.warning(
                    "Cron sync tentativa %d falhou, retentando em %.0fs...",
                    attempt + 1, CRON_RETRY_DELAY,
                )
                await asyncio.sleep(CRON_RETRY_DELAY)

    raise last_error
