from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class TradeBase(BaseModel):
    ticket: int
    symbol: str
    type: str
    open_time: Optional[datetime] = None
    close_time: datetime
    profit: float
    commission: float
    swap: float
    comment: Optional[str] = None
    
    # Campos editables del Journal
    strategy: Optional[str] = None
    emotion: Optional[str] = None
    mistake: Optional[str] = None
    notes: Optional[str] = None

class EmotionResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class MistakeResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class StrategyItemResponse(BaseModel):
    id: int
    condition: str
    weight_percent: float
    model_config = ConfigDict(from_attributes=True)

class StrategyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    items: List[StrategyItemResponse] = []
    model_config = ConfigDict(from_attributes=True)

class TradeResponse(TradeBase):
    id: int
    account_id: int

    emotion_id: Optional[int] = None
    mistake_id: Optional[int] = None
    strategy_id: Optional[int] = None

    emotion: Optional[EmotionResponse] = None
    mistake: Optional[MistakeResponse] = None
    strategy: Optional[StrategyResponse] = None
    
    account_alias: Optional[str] = None 
    trade_idea_id: Optional[int] = None

    account_alias: str = "N/A"
    
    model_config = ConfigDict(from_attributes=True)

class TradeUpdate(BaseModel):
    emotion: Optional[str] = None
    mistake: Optional[str] = None
    notes: Optional[str] = None

class TradeAnalysisUpdate(BaseModel):
    emotion_id: Optional[int] = None
    mistake_id: Optional[int] = None
    strategy_id: Optional[int] = None
    trade_idea_id: Optional[int] = None

class DailyStat(BaseModel):
    date: str
    profit: float
    trades_count: int
    wins: int
    losses: int

class CalendarResponse(BaseModel):
    month_total_profit: float
    month_win_rate: float
    total_trades: int
    days: List[DailyStat]

class ChartDataPoint(BaseModel):
    date: str
    balance: float

class RiskMetrics(BaseModel):
    account_alias: str
    current_balance: float
    initial_balance: float
    is_trailing: bool
    max_drawdown_percent: float
    high_water_mark: float
    drawdown_limit_price: float
    current_drawdown_amount: float
    drawdown_progress: float
    consistency_rule_percent: float
    highest_daily_profit: float
    profit_target_for_consistency: float
    consistency_progress: float
    is_in_drawdown: bool

class DashboardStats(BaseModel):
    total_balance: float
    total_pl: float
    active_accounts: int
    win_rate: float
    recent_trades: List[TradeResponse]
    balance_curve: List[ChartDataPoint]
    best_trade: float
    worst_trade: float
    average_win: float
    average_loss: float
    highest_profitable_day: float
    total_trades_count: int
    profit_factor: float
    average_rrr: float
    sharpe_ratio: float
    z_score: float
    risk_metrics: List[RiskMetrics]
