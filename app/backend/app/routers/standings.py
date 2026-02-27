from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Team
from ..schemas import TeamOut

router = APIRouter()


@router.get("", response_model=list[TeamOut])
def get_standings(db: Session = Depends(get_db)):
    """Retorna a tabela do Brasileirão ordenada por posição."""
    return db.query(Team).order_by(Team.position).all()
