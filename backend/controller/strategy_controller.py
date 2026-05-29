from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.orm import Session
from config.postgres_database import get_db
from services.strategy_service import StrategyService
from schemas.strategies.strategy_schema import StrategyCreate, StrategyResponse

router = APIRouter(tags=["Strategies"])

@router.post("/strategies/", response_model=StrategyResponse)
def create_strategy(strategy: StrategyCreate, db: Session = Depends(get_db)):
    service = StrategyService(db)
    return service.create_strategy(strategy)
