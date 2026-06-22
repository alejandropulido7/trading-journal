from sqlalchemy.orm import Session
from typing import List, Optional
from models import TradeIdea, TimeframeEvidence
from repositories.trade_ideas.i_trade_idea_repository import ITradeIdeaRepository

class PostgresTradeIdeaRepository(ITradeIdeaRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, start_date: Optional[str] = None, 
                end_date: Optional[str] = None, 
                skip: int = 0, 
                limit: int = 10,
                user_id: int = None) -> List[TradeIdea]:
        query = self.db.query(TradeIdea).filter(TradeIdea.user_id == user_id)
        if start_date:
            query = query.filter(TradeIdea.created_at >= start_date)
        if end_date:
            query = query.filter(TradeIdea.created_at <= f"{end_date} 23:59:59")
        return query.order_by(TradeIdea.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_id(self, idea_id: int) -> Optional[TradeIdea]:
        return self.db.query(TradeIdea).filter(TradeIdea.id == idea_id).first()

    def create(self, idea: TradeIdea) -> TradeIdea:
        self.db.add(idea)
        self.db.commit()
        self.db.refresh(idea)
        return idea

    def update(self, idea: TradeIdea) -> TradeIdea:
        self.db.commit()
        self.db.refresh(idea)
        return idea

    def delete(self, idea: TradeIdea) -> None:
        self.db.delete(idea)
        self.db.commit()

    def create_evidence(self, evidence: TimeframeEvidence) -> TimeframeEvidence:
        self.db.add(evidence)
        self.db.commit()
        self.db.refresh(evidence)
        return evidence
