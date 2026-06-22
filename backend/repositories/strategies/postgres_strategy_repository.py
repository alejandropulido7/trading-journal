from sqlalchemy.orm import Session, selectinload
from typing import List, Optional

from models.strategies.strategy_models import Strategy
from repositories.strategies.i_strategy_repository import IStrategyRepository

class PostgresStrategyRepository(IStrategyRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, user_id:int) -> List[Strategy]:
        # selectinload carga los items en memoria en una sola consulta optimizada
        return self.db.query(Strategy).filter(Strategy.user_id == user_id).options(selectinload(Strategy.items)).all()

    def get_by_id(self, strategy_id: int) -> Optional[Strategy]:
        return self.db.query(Strategy).options(selectinload(Strategy.items)).filter(Strategy.id == strategy_id).first()

    def create(self, strategy: Strategy) -> Strategy:
        self.db.add(strategy)
        self.db.commit()
        self.db.refresh(strategy)
        return strategy

    def update(self, strategy: Strategy) -> Strategy:
        self.db.commit()
        self.db.refresh(strategy)
        return strategy

    def delete(self, strategy: Strategy) -> None:
        self.db.delete(strategy)
        self.db.commit()