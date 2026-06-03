from sqlalchemy.orm import Session
from models import Strategy, StrategyItem
from schemas.strategies.strategy_schema import StrategyCreate

class StrategyService:
    def __init__(self, db: Session):
        self.db = db

    def create_strategy(self, strategy: StrategyCreate):
        db_strategy = Strategy(name=strategy.name, description=strategy.description)
        self.db.add(db_strategy)
        self.db.commit()
        self.db.refresh(db_strategy)
        
        for item in strategy.items:
            db_item = StrategyItem(
                strategy_id=db_strategy.id,
                condition=item.condition,
                weight_percent=item.weight_percent
            )
            self.db.add(db_item)
            
        self.db.commit()
        self.db.refresh(db_strategy)
        return db_strategy
