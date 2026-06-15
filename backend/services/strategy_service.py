from schemas.strategies.strategy_schema import StrategyCreate, StrategyUpdate
from repositories.strategies.i_strategy_repository import IStrategyRepository
from models.strategies.strategy_models import Strategy, StrategyItem
from core.exceptions import NotFoundError, BusinessLogicError

class StrategyService:
    def __init__(self, repo: IStrategyRepository):
        self.repo = repo

    def _validate_weight(self, items):
        total_weight = sum(item.weight_percent for item in items)
        if total_weight != 100:
            raise BusinessLogicError(f"El peso total de la estrategia debe ser 100%. Actual: {total_weight}%")

    def get_all_strategies(self):
        return self.repo.get_all()

    def get_strategy_by_id(self, strategy_id: int):
        strategy = self.repo.get_by_id(strategy_id)
        if not strategy:
            raise NotFoundError(entity_name="Estrategia", entity_id=strategy_id)
        return strategy

    def create_strategy(self, data: StrategyCreate):
        self._validate_weight(data.items)
        
        # Mapeo de DTO a Modelo
        new_strategy = Strategy(
            name=data.name,
            description=data.description,
            items=[StrategyItem(condition=i.condition, weight_percent=i.weight_percent) for i in data.items]
        )
        return self.repo.create(new_strategy)

    def update_strategy(self, strategy_id: int, data: StrategyUpdate):
        self._validate_weight(data.items)
        
        strategy = self.repo.get_by_id(strategy_id)
        if not strategy:
            raise NotFoundError(entity_name="Estrategia", entity_id=strategy_id)

        strategy.name = data.name
        strategy.description = data.description
        
        # SQLAlchemy borrará los viejos y creará los nuevos gracias a delete-orphan
        strategy.items = [StrategyItem(condition=i.condition, weight_percent=i.weight_percent) for i in data.items]
        
        return self.repo.update(strategy)

    def delete_strategy(self, strategy_id: int):
        strategy = self.repo.get_by_id(strategy_id)
        if not strategy:
            raise NotFoundError(entity_name="Estrategia", entity_id=strategy_id)
            
        self.repo.delete(strategy)