from abc import ABC, abstractmethod
from typing import List, Optional
from models import TradeIdea, TimeframeEvidence

class ITradeIdeaRepository(ABC):
    
    @abstractmethod
    def get_all(self, start_date: Optional[str] = None, end_date: Optional[str] = None, skip: int = 0, limit: int = 10, user_id:int = None) -> List[TradeIdea]:
        pass
        
    @abstractmethod
    def get_by_id(self, idea_id: int) -> Optional[TradeIdea]:
        pass

    @abstractmethod
    def create(self, idea: TradeIdea) -> TradeIdea:
        pass

    @abstractmethod
    def update(self, idea: TradeIdea) -> TradeIdea:
        pass

    @abstractmethod
    def delete(self, idea: TradeIdea) -> None:
        pass

    @abstractmethod
    def create_evidence(self, evidence: TimeframeEvidence) -> TimeframeEvidence:
        pass
