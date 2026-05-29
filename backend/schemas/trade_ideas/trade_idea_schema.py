from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class TradeIdeaItemBase(BaseModel):
    strategy_item_id: int
    is_active: bool
    direction: Optional[str] = None

class TradeIdeaCreate(BaseModel):
    asset: str
    strategy_id: int
    checklist: List[TradeIdeaItemBase]

class TimeframeEvidenceResponse(BaseModel):
    id: int
    timeframe: str
    note: str
    image_url: str
    model_config = ConfigDict(from_attributes=True)

class TradeIdeaItemResponse(BaseModel):
    id: int
    strategy_item_id: int
    is_active: bool
    direction: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class TradeIdeaResponse(BaseModel):
    id: int
    asset: str
    created_at: datetime
    status: str
    strategy_id: int
    checklist: List[TradeIdeaItemResponse] = []
    evidences: List[TimeframeEvidenceResponse] = []
    model_config = ConfigDict(from_attributes=True)

class StatusUpdate(BaseModel):
    status: str # "DRAFT", "EXECUTED", "DISCARDED"
