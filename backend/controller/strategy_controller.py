from fastapi import APIRouter, Depends
from typing import List

from schemas.strategies import strategy_schema
from services.strategy_service import StrategyService
from core.dependencies import get_strategy_service 

router = APIRouter(prefix="/strategies", tags=["Strategies"])

class StrategyController:
    def __init__(self, service: StrategyService = Depends(get_strategy_service)):
        self.service = service

    def get_all(self): return self.service.get_all_strategies()
    def get_by_id(self, strategy_id: int): return self.service.get_strategy_by_id(strategy_id)
    def create(self, data: strategy_schema.StrategyCreate): return self.service.create_strategy(data)
    def update(self, strategy_id: int, data: strategy_schema.StrategyUpdate): return self.service.update_strategy(strategy_id, data)
    def delete(self, strategy_id: int): 
        self.service.delete_strategy(strategy_id)
        return {"message": "Estrategia eliminada con éxito"}


# --- RUTAS ---
@router.get("/", response_model=List[strategy_schema.StrategyResponse])
def get_strategies_route(controller: StrategyController = Depends()):
    return controller.get_all()

@router.get("/{strategy_id}", response_model=strategy_schema.StrategyResponse)
def get_strategy_route(strategy_id: int, controller: StrategyController = Depends()):
    return controller.get_by_id(strategy_id)

@router.post("/", response_model=strategy_schema.StrategyResponse)
def create_strategy_route(data: strategy_schema.StrategyCreate, controller: StrategyController = Depends()):
    return controller.create(data)

@router.put("/{strategy_id}", response_model=strategy_schema.StrategyResponse)
def update_strategy_route(strategy_id: int, data: strategy_schema.StrategyUpdate, controller: StrategyController = Depends()):
    return controller.update(strategy_id, data)

@router.delete("/{strategy_id}")
def delete_strategy_route(strategy_id: int, controller: StrategyController = Depends()):
    return controller.delete(strategy_id)