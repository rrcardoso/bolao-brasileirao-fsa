"""Download and cache team badges from Sofascore."""

import asyncio
import logging
from pathlib import Path

from ..config import settings

logger = logging.getLogger("bolao.badges")

BADGES_DIR = Path(__file__).resolve().parent.parent.parent / "static" / "badges"
BADGE_URL = "https://api.sofascore.app/api/v1/team/{team_id}/image"


def _ensure_dir():
    BADGES_DIR.mkdir(parents=True, exist_ok=True)


def badge_path(sofascore_id: int) -> Path:
    return BADGES_DIR / f"{sofascore_id}.webp"


def badge_exists(sofascore_id: int) -> bool:
    return badge_path(sofascore_id).is_file()


async def download_badge(sofascore_id: int) -> bool:
    if badge_exists(sofascore_id):
        return True

    _ensure_dir()

    from functools import lru_cache

    from .sofascore import _get_scraper

    url = BADGE_URL.format(team_id=sofascore_id)
    try:
        scraper = _get_scraper()
        resp = await asyncio.to_thread(scraper.get, url, timeout=15)
        if resp.status_code == 200 and len(resp.content) > 100:
            badge_path(sofascore_id).write_bytes(resp.content)
            logger.info("Badge %d salvo (%d bytes).", sofascore_id, len(resp.content))
            return True
        logger.warning("Badge %d: status %d", sofascore_id, resp.status_code)
    except Exception as e:
        logger.warning("Badge %d: %s", sofascore_id, e)
    return False


async def download_all_badges(sofascore_ids: list[int]) -> int:
    """Download badges for all team IDs, skipping those already cached."""
    _ensure_dir()
    downloaded = 0
    for team_id in sofascore_ids:
        if badge_exists(team_id):
            continue
        ok = await download_badge(team_id)
        if ok:
            downloaded += 1
        await asyncio.sleep(0.3)
    logger.info("Badges: %d novos, %d total.", downloaded, len(sofascore_ids))
    return downloaded
