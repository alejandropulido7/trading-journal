from abc import ABC, abstractmethod
from typing import Optional, List
from models.strategies.strategy_models import Strategy

class IStrategyRepository(ABC):
    @abstractmethod
    def get_all(self) -> List[Strategy]: pass
    
    @abstractmethod
    def get_by_id(self, strategy_id: int) -> Optional[Strategy]: pass
    
    @abstractmethod
    def create(self, strategy: Strategy) -> Strategy: pass
    
    @abstractmethod
    def update(self, strategy: Strategy) -> Strategy: pass

    @abstractmethod
    def delete(self, strategy: Strategy) -> None: pass