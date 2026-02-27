from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import RankingResponse
from ..services.ranking_service import build_ranking

router = APIRouter()


@router.get("", response_model=RankingResponse)
def get_ranking(db: Session = Depends(get_db)):
    return build_ranking(db)
