import asyncio
import logging
import urllib.parse

import cloudscraper
import httpx

from ..config import settings

logger = logging.getLogger("bolao.sofascore")


# ---------------------------------------------------------------------------
# Strategy 1: cloudscraper (bypasses Cloudflare, no external dependency)
# ---------------------------------------------------------------------------

def _create_scraper() -> cloudscraper.CloudScraper:
    return cloudscraper.create_scraper(
        browser={"browser": "chrome", "platform": "windows", "mobile": False}
    )


async def _fetch_cloudscraper(url: str) -> dict | None:
    try:
        scraper = _create_scraper()
        resp = await asyncio.to_thread(scraper.get, url, timeout=20)
        if resp.status_code == 200:
            logger.info("cloudscraper: OK (%d bytes)", len(resp.content))
            return resp.json()
        logger.warning("cloudscraper: status %d — %s", resp.status_code, resp.text[:200])
    except Exception as e:
        logger.warning("cloudscraper falhou: %s", e)
    return None


# ---------------------------------------------------------------------------
# Strategy 2: scrape.do proxy (fallback, requires BOLAO_SCRAPEDO_TOKEN)
# ---------------------------------------------------------------------------

async def _fetch_scrapedo(url: str) -> dict | None:
    token = settings.SCRAPEDO_TOKEN
    if not token:
        logger.info("scrape.do: token não configurado, pulando fallback.")
        return None

    encoded_url = urllib.parse.quote(url, safe="")
    proxy_url = f"https://api.scrape.do/?token={token}&url={encoded_url}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(proxy_url)
            if resp.status_code == 200:
                logger.info("scrape.do: OK")
                return resp.json()
            logger.warning("scrape.do: status %d — %s", resp.status_code, resp.text[:200])
    except Exception as e:
        logger.warning("scrape.do: %s", e)
    return None


# ---------------------------------------------------------------------------
# Fetch with fallback chain
# ---------------------------------------------------------------------------

async def fetch_with_retry(url: str) -> dict:
    """Tenta cloudscraper primeiro; se falhar, tenta scrape.do como fallback."""

    for attempt in range(settings.SOFASCORE_MAX_RETRIES + 1):
        data = await _fetch_cloudscraper(url)
        if data:
            return data

        if attempt < settings.SOFASCORE_MAX_RETRIES:
            await asyncio.sleep(settings.SOFASCORE_RETRY_DELAY)

    data = await _fetch_scrapedo(url)
    if data:
        return data

    raise RuntimeError(
        "API Sofascore falhou em todos os métodos (cloudscraper + scrape.do). "
        "Verifique se o season_id está correto e se o campeonato já começou. "
        "Para usar scrape.do, configure BOLAO_SCRAPEDO_TOKEN."
    )


async def fetch_standings() -> list[dict]:
    url = (
        f"{settings.SOFASCORE_BASE_URL}/unique-tournament/"
        f"{settings.TOURNAMENT_ID}/season/{settings.SEASON_ID}/standings/total"
    )
    logger.info(
        "Buscando standings: tournament=%d, season=%d, url=%s",
        settings.TOURNAMENT_ID,
        settings.SEASON_ID,
        url,
    )

    data = await fetch_with_retry(url)

    if not isinstance(data, dict):
        raise RuntimeError(f"Resposta inesperada da API (tipo: {type(data).__name__})")

    standings_list = data.get("standings")
    if not standings_list or not isinstance(standings_list, list):
        keys = list(data.keys())[:10] if isinstance(data, dict) else str(data)[:200]
        raise RuntimeError(
            f"Campo 'standings' ausente ou inválido na resposta. "
            f"Chaves recebidas: {keys}"
        )

    rows = standings_list[0].get("rows")
    if not rows:
        raise RuntimeError(
            "Campo 'rows' ausente ou vazio no primeiro grupo de standings."
        )

    logger.info("Sofascore retornou %d times.", len(rows))

    return [
        {
            "teamId": row["team"]["id"],
            "teamName": row["team"]["name"],
            "teamSlug": row["team"].get("slug", ""),
            "teamNameCode": row["team"].get("nameCode", ""),
            "position": row["position"],
            "points": row.get("points", 0),
            "matches": row.get("matches", 0),
            "wins": row.get("wins", 0),
            "draws": row.get("draws", 0),
            "losses": row.get("losses", 0),
            "scoresFor": row.get("scoresFor", 0),
            "scoresAgainst": row.get("scoresAgainst", 0),
        }
        for row in rows
    ]


async def fetch_latest_season_id() -> int:
    url = (
        f"{settings.SOFASCORE_BASE_URL}/unique-tournament/"
        f"{settings.TOURNAMENT_ID}/seasons"
    )
    data = await fetch_with_retry(url)
    return data["seasons"][0]["id"]
