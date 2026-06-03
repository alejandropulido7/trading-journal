from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import date
from models import Trade, Emotion, Mistake, Strategy

class ITradeRepository(ABC):
    
    @abstractmethod
    def get_all(self, trade_date: Optional[date] = None) -> List[Trade]:
        pass
        
    @abstractmethod
    def get_by_id(self, trade_id: int) -> Optional[Trade]:
        pass

    @abstractmethod
    def update(self, trade: Trade) -> Trade:
        pass

    @abstractmethod
    def create(self, trade: Trade) -> Trade:
        pass

    @abstractmethod
    def get_emotions(self) -> List[Emotion]:
        pass

    @abstractmethod
    def get_mistakes(self) -> List[Mistake]:
        pass

    @abstractmethod
    def get_strategies(self) -> List[Strategy]:
        pass
    
    @abstractmethod
    def get_trades_for_stats(self, account_id: Optional[int] = None) -> List[Trade]:
        pass

    @abstractmethod
    def get_trades_by_month(self, year: int, month: int, account_id: Optional[int] = None) -> List[Trade]:
        pass
