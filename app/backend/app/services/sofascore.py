import asyncio
import logging
import urllib.parse

import cloudscraper
import httpx

from ..config import settings

logger = logging.getLogger("bolao.sofascore")

_HTTPX_HEADERS = {
    "User-Agent": settings.SOFASCORE_USER_AGENT,
    "Accept": "application/json",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://www.sofascore.com/",
    "Origin": "https://www.sofascore.com",
}


# ---------------------------------------------------------------------------
# Strategy 1: plain httpx (fastest — works when Cloudflare isn't blocking)
# ---------------------------------------------------------------------------

async def _fetch_httpx(url: str) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=15.0, headers=_HTTPX_HEADERS) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                logger.info("httpx direto: OK (%d bytes)", len(resp.content))
                return resp.json()
            logger.warning("httpx direto: status %d", resp.status_code)
    except Exception as e:
        logger.warning("httpx direto falhou: %s", e)
    return None


# ---------------------------------------------------------------------------
# Strategy 2: cloudscraper (bypasses Cloudflare JS challenge)
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
# Strategy 3: scrape.do proxy (requires BOLAO_SCRAPEDO_TOKEN)
# ---------------------------------------------------------------------------

async def _fetch_scrapedo(url: str) -> dict | None:
    token = settings.SCRAPEDO_TOKEN
    if not token:
        logger.info("scrape.do: token não configurado, pulando.")
        return None

    encoded_url = urllib.parse.quote(url, safe="")
    proxy_url = f"https://api.scrape.do/?token={token}&url={encoded_url}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(proxy_url)
            if resp.status_code == 200:
                logger.info("scrape.do: OK (%d bytes)", len(resp.content))
                return resp.json()
            logger.warning("scrape.do: status %d — %s", resp.status_code, resp.text[:200])
    except Exception as e:
        logger.warning("scrape.do falhou: %s", e)
    return None


# ---------------------------------------------------------------------------
# Fetch with fallback chain + retries
# ---------------------------------------------------------------------------

_STRATEGIES = [
    ("httpx", _fetch_httpx),
    ("cloudscraper", _fetch_cloudscraper),
    ("scrape.do", _fetch_scrapedo),
]


async def fetch_with_retry(url: str) -> dict:
    """
    Tries multiple strategies with retries and exponential backoff.
    Order: httpx → cloudscraper → scrape.do, repeated up to MAX_RETRIES.
    """
    max_retries = settings.SOFASCORE_MAX_RETRIES
    base_delay = settings.SOFASCORE_RETRY_DELAY
    errors: list[str] = []

    for attempt in range(max_retries + 1):
        if attempt > 0:
            delay = base_delay * attempt
            logger.info("Tentativa %d/%d — aguardando %.1fs...", attempt + 1, max_retries + 1, delay)
            await asyncio.sleep(delay)

        for name, fetch_fn in _STRATEGIES:
            data = await fetch_fn(url)
            if data:
                if attempt > 0:
                    logger.info("Sucesso na tentativa %d via %s.", attempt + 1, name)
                return data
            errors.append(f"{name} (tentativa {attempt + 1})")

    raise RuntimeError(
        f"Sofascore falhou após {max_retries + 1} tentativas em todos os métodos: "
        f"{', '.join(errors)}. "
        "Verifique se o season_id está correto e se o campeonato já começou."
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
