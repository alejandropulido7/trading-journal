from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class StrategyItemBase(BaseModel):
    condition: str
    weight_percent: float

class StrategyItemCreate(StrategyItemBase):
    pass

class StrategyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    items: List[StrategyItemCreate]

class StrategyItemResponse(StrategyItemBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class StrategyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    items: List[StrategyItemResponse] = []
    model_config = ConfigDict(from_attributes=True)
