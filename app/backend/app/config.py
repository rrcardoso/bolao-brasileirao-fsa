from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SEASON_YEAR: int = 2026
    TOURNAMENT_ID: int = 325
    SEASON_ID: int = 87678
    TIMES_PER_APOSTADOR: int = 7
    MIN_TEAMS_PROTECTION: int = 20
    DISPLAY_COLUMN: str = "teamName"

    DATABASE_URL: str = "sqlite:///./bolao.db"

    SOFASCORE_BASE_URL: str = "https://www.sofascore.com/api/v1"
    SOFASCORE_USER_AGENT: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )
    SOFASCORE_MAX_RETRIES: int = 1
    SOFASCORE_RETRY_DELAY: float = 3.0

    SCRAPEDO_TOKEN: str = ""

    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "bolao2026"
    SECRET_KEY: str = "change-me-to-a-random-secret-key"
    JWT_EXPIRE_MINUTES: int = 480

    CRON_SECRET: str = "change-me-to-a-random-cron-secret"

    class Config:
        env_prefix = "BOLAO_"
        env_file = ".env"


settings = Settings()
