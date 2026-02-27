from datetime import date, datetime

from pydantic import BaseModel, Field


# --- Teams ---


class TeamOut(BaseModel):
    id: int
    sofascore_id: int
    name: str
    slug: str
    name_code: str
    position: int
    points: int
    matches: int
    wins: int
    draws: int
    losses: int
    goals_for: int
    goals_against: int
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Palpites ---


class PalpiteIn(BaseModel):
    team_id: int
    prioridade: int = Field(ge=1, le=7)


class PalpiteOut(BaseModel):
    id: int
    team_id: int
    prioridade: int
    team: TeamOut | None = None

    model_config = {"from_attributes": True}


# --- Apostadores ---


class ApostadorCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    ordem_inscricao: int = Field(ge=1)
    palpites: list[PalpiteIn] = Field(min_length=7, max_length=7)


class ImportResult(BaseModel):
    created: int
    skipped: int
    errors: list[str]


class ApostadorUpdate(BaseModel):
    nome: str | None = Field(None, min_length=1, max_length=100)
    ordem_inscricao: int | None = Field(None, ge=1)
    palpites: list[PalpiteIn] | None = Field(None, min_length=7, max_length=7)


class ApostadorOut(BaseModel):
    id: int
    nome: str
    ordem_inscricao: int
    created_at: datetime
    palpites: list[PalpiteOut] = []

    model_config = {"from_attributes": True}


# --- Ranking ---


class RankingEntry(BaseModel):
    rank: int
    apostador: str
    ordem_inscricao: int
    total: int
    pontos: list[int]
    times: list[str]
    times_codes: list[str]
    team_ids: list[int]
    team_positions: list[int]


class RankingResponse(BaseModel):
    updated_at: str
    display_column: str
    entries: list[RankingEntry]


# --- Historico ---


class SnapshotOut(BaseModel):
    session_date: date
    rodada: int
    apostador: str
    pontuacao: int
    rank: int

    model_config = {"from_attributes": True}


# --- Admin ---


class SyncResponse(BaseModel):
    teams_count: int
    apostadores_count: int
    historico_session: str | None = None
    message: str


class ConfigOut(BaseModel):
    season_year: int
    tournament_id: int
    season_id: int
    times_per_apostador: int
    min_teams_protection: int
    display_column: str
