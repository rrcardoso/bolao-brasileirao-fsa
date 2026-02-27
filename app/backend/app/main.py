import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routers import admin, apostadores, auth, historico, ranking, standings, teams

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend_dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    STATIC_DIR.mkdir(parents=True, exist_ok=True)
    (STATIC_DIR / "badges").mkdir(exist_ok=True)
    yield


app = FastAPI(
    title="Bolão Brasileirão API",
    version="0.1.0",
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
render_url = os.getenv("RENDER_EXTERNAL_URL")
if render_url:
    allowed_origins.append(render_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if render_url else allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.api_route("/api/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "ok"}


app.include_router(teams.router, prefix="/api/teams", tags=["times"])
app.include_router(apostadores.router, prefix="/api/apostadores", tags=["apostadores"])
app.include_router(ranking.router, prefix="/api/ranking", tags=["ranking"])
app.include_router(historico.router, prefix="/api/historico", tags=["historico"])
app.include_router(standings.router, prefix="/api/standings", tags=["standings"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

if FRONTEND_DIR.exists():
    assets_dir = FRONTEND_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend_assets")

    @app.get("/{path:path}")
    async def spa_fallback(path: str):
        file = FRONTEND_DIR / path
        if file.exists() and file.is_file():
            return FileResponse(file)
        return FileResponse(FRONTEND_DIR / "index.html")
else:

    @app.get("/")
    def root():
        return {"status": "ok", "app": "Bolão Brasileirão API"}
