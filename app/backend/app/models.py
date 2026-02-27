from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .services.session_utils import brasilia_now


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True)
    sofascore_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(120), default="")
    name_code: Mapped[str] = mapped_column(String(10), default="")
    position: Mapped[int] = mapped_column(Integer, default=0)
    points: Mapped[int] = mapped_column(Integer, default=0)
    matches: Mapped[int] = mapped_column(Integer, default=0)
    wins: Mapped[int] = mapped_column(Integer, default=0)
    draws: Mapped[int] = mapped_column(Integer, default=0)
    losses: Mapped[int] = mapped_column(Integer, default=0)
    goals_for: Mapped[int] = mapped_column(Integer, default=0)
    goals_against: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=brasilia_now, onupdate=brasilia_now
    )

    palpites: Mapped[list["Palpite"]] = relationship(back_populates="team")


class Apostador(Base):
    __tablename__ = "apostadores"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True)
    ordem_inscricao: Mapped[int] = mapped_column(Integer, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=brasilia_now)

    palpites: Mapped[list["Palpite"]] = relationship(
        back_populates="apostador", cascade="all, delete-orphan"
    )
    snapshots: Mapped[list["Snapshot"]] = relationship(
        back_populates="apostador", cascade="all, delete-orphan"
    )


class Palpite(Base):
    __tablename__ = "palpites"
    __table_args__ = (
        UniqueConstraint("apostador_id", "prioridade", name="uq_apostador_prioridade"),
        UniqueConstraint("apostador_id", "team_id", name="uq_apostador_team"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    apostador_id: Mapped[int] = mapped_column(ForeignKey("apostadores.id"))
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"))
    prioridade: Mapped[int] = mapped_column(Integer)

    apostador: Mapped["Apostador"] = relationship(back_populates="palpites")
    team: Mapped["Team"] = relationship(back_populates="palpites")


class Snapshot(Base):
    __tablename__ = "snapshots"
    __table_args__ = (
        UniqueConstraint(
            "session_date", "apostador_id", name="uq_session_apostador"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    session_date: Mapped[date] = mapped_column(Date)
    rodada: Mapped[int] = mapped_column(Integer)
    apostador_id: Mapped[int] = mapped_column(ForeignKey("apostadores.id"))
    pontuacao: Mapped[int] = mapped_column(Integer)
    rank: Mapped[int] = mapped_column(Integer)

    apostador: Mapped["Apostador"] = relationship(back_populates="snapshots")
