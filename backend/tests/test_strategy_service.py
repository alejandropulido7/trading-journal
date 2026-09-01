import pytest
from unittest.mock import MagicMock
from services.strategy_service import StrategyService
from schemas.strategies.strategy_schema import StrategyCreate, StrategyUpdate, StrategyItemCreate, StrategyItemUpdate
from models.strategies.strategy_models import Strategy, StrategyItem
from core.exceptions import BusinessLogicError, NotFoundError

def test_strategy_service_validate_weight_fails_when_not_100():
    mock_repo = MagicMock()
    service = StrategyService(mock_repo)
    
    items = [
        StrategyItemCreate(condition="RSI < 30", weight_percent=40.0),
        StrategyItemCreate(condition="EMA crossover", weight_percent=40.0) # Sum = 80
    ]
    data = StrategyCreate(name="Invalid Strategy", description="Invalid", items=items)
    
    with pytest.raises(BusinessLogicError) as exc_info:
        service.create_strategy(data, user_id=1)
    assert "El peso total de la estrategia debe ser 100%. Actual: 80.0%" in str(exc_info.value)

def test_strategy_service_create_strategy_success():
    mock_repo = MagicMock()
    service = StrategyService(mock_repo)
    
    items = [
        StrategyItemCreate(condition="Liquidity Sweep", weight_percent=60.0),
        StrategyItemCreate(condition="FVG Rejection", weight_percent=40.0)
    ]
    data = StrategyCreate(name="Valid SMC Strategy", description="Valid strategy", items=items)
    
    def fake_create(strategy):
        strategy.id = 1
        return strategy
        
    mock_repo.create.side_effect = fake_create
    
    result = service.create_strategy(data, user_id=10)
    assert result.id == 1
    assert result.name == "Valid SMC Strategy"
    assert result.user_id == 10
    assert len(result.items) == 2
    mock_repo.create.assert_called_once()

def test_strategy_service_get_all_strategies():
    mock_repo = MagicMock()
    mock_repo.get_all.return_value = [
        Strategy(id=1, name="Strat 1", user_id=2),
        Strategy(id=2, name="Strat 2", user_id=2)
    ]
    service = StrategyService(mock_repo)
    res = service.get_all_strategies(user_id=2)
    assert len(res) == 2
    mock_repo.get_all.assert_called_once_with(2)

def test_strategy_service_get_strategy_by_id_found():
    mock_repo = MagicMock()
    mock_repo.get_by_id.return_value = Strategy(id=1, name="Strat 1", user_id=2)
    service = StrategyService(mock_repo)
    res = service.get_strategy_by_id(1)
    assert res.id == 1
    assert res.name == "Strat 1"

def test_strategy_service_get_strategy_by_id_not_found():
    mock_repo = MagicMock()
    mock_repo.get_by_id.return_value = None
    service = StrategyService(mock_repo)
    
    with pytest.raises(NotFoundError) as exc_info:
        service.get_strategy_by_id(999)
    assert "Estrategia con ID 999 no fue encontrado/a." in str(exc_info.value)

def test_strategy_service_update_strategy_success():
    mock_repo = MagicMock()
    existing = Strategy(id=1, name="Old Name", description="Old Desc", user_id=2, items=[])
    mock_repo.get_by_id.return_value = existing
    mock_repo.update.side_effect = lambda s: s
    
    service = StrategyService(mock_repo)
    update_data = StrategyUpdate(
        name="New Name",
        description="New Desc",
        items=[StrategyItemUpdate(condition="New Cond", weight_percent=100.0)]
    )
    
    updated = service.update_strategy(1, update_data)
    assert updated.name == "New Name"
    assert updated.description == "New Desc"
    assert len(updated.items) == 1
    assert updated.items[0].condition == "New Cond"
    mock_repo.update.assert_called_once()

def test_strategy_service_update_strategy_not_found():
    mock_repo = MagicMock()
    mock_repo.get_by_id.return_value = None
    service = StrategyService(mock_repo)
    
    update_data = StrategyUpdate(
        name="New Name",
        description="New Desc",
        items=[StrategyItemUpdate(condition="New Cond", weight_percent=100.0)]
    )
    
    with pytest.raises(NotFoundError):
        service.update_strategy(999, update_data)

def test_strategy_service_delete_strategy_success():
    mock_repo = MagicMock()
    existing = Strategy(id=1, name="Strat to delete", user_id=2)
    mock_repo.get_by_id.return_value = existing
    
    service = StrategyService(mock_repo)
    service.delete_strategy(1)
    mock_repo.delete.assert_called_once_with(existing)

def test_strategy_service_delete_strategy_not_found():
    mock_repo = MagicMock()
    mock_repo.get_by_id.return_value = None
    service = StrategyService(mock_repo)
    
    with pytest.raises(NotFoundError):
        service.delete_strategy(999)
