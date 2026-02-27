import logging

from sqlalchemy.orm import Session

from ..models import Apostador, Snapshot, Team
from ..services.ranking_service import build_ranking
from ..services.session_utils import format_date_key, get_session_date

logger = logging.getLogger("bolao.historico")


def record_snapshot(db: Session) -> str | None:
    """
    Record a historical snapshot for the current session.
    Within the same session (Tue or Fri), overwrites existing data.
    New session appends new rows.
    Returns the session key or None if no data.
    """
    ranking = build_ranking(db)
    if not ranking.entries:
        logger.info("Historico: sem dados de ranking.")
        return None

    max_matches = db.query(Team.matches).order_by(Team.matches.desc()).first()
    rodada = max_matches[0] if max_matches else 0

    session_date = get_session_date()
    session_key = format_date_key(session_date)

    existing = (
        db.query(Snapshot).filter(Snapshot.session_date == session_date).all()
    )
    if existing:
        for snap in existing:
            db.delete(snap)
        db.flush()
        logger.info(
            "Historico: sessão %s sobrescrita (%d linhas removidas).",
            session_key,
            len(existing),
        )

    apostador_map = {a.nome: a.id for a in db.query(Apostador).all()}

    for entry in ranking.entries:
        ap_id = apostador_map.get(entry.apostador)
        if ap_id is None:
            continue
        db.add(
            Snapshot(
                session_date=session_date,
                rodada=rodada,
                apostador_id=ap_id,
                pontuacao=entry.total,
                rank=entry.rank,
            )
        )

    db.commit()
    logger.info(
        "Historico: sessão %s, rodada %d — %d registros.",
        session_key,
        rodada,
        len(ranking.entries),
    )
    return session_key
