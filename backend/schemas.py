from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

# --- TRADES ---

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

# 1. Asegúrate de tener schemas básicos para leer las relaciones
class EmotionResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class MistakeResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class StrategyResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

# --- SCHEMAS PARA TRADE IDEAS ---

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
    
    # Anidamos el checklist y las fotos en la respuesta
    checklist: List[TradeIdeaItemResponse] = []
    evidences: List[TimeframeEvidenceResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

class TradeResponse(TradeBase):
    id: int
    account_id: int

    emotion_id: Optional[int] = None
    mistake_id: Optional[int] = None
    strategy_id: Optional[int] = None

    # Hacer opcionales los objetos completos (¡Esto es lo que suele fallar!)
    emotion: Optional[EmotionResponse] = None
    mistake: Optional[MistakeResponse] = None
    strategy: Optional[StrategyResponse] = None
    
    # Campo extra para mostrar el nombre de la cuenta en las Cards del Frontend
    account_alias: Optional[str] = None 
    trade_idea_id: Optional[int] = None
    trade_idea: Optional[TradeIdeaResponse] = None
    
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

# --- CUENTAS ---

class AccountCreate(BaseModel):
    login_id: int
    password: str
    server: str
    alias: str
    prop_firm: str
    account_type: str
    initial_balance: float
    risk_per_trade: float
    target_percent: float
    investment: float
    trailing_drawdown: bool
    daily_drawdown_limit: float
    max_drawdown_limit: float
    consistency_rule: float
    start_date: str

class AccountResponse(BaseModel):
    id: int
    login_id: int
    server: str
    alias: str
    prop_firm: str
    account_type: str
    active: bool
    
    initial_balance: float
    balance: float
    risk_per_trade: float
    target_percent: float
    investment: float

    trailing_drawdown: bool
    daily_drawdown_limit: float
    max_drawdown_limit: float
    consistency_rule: float
    start_date: Optional[str] = None
    loss_reason: Optional[str] = None
    
    # Estos campos NO están en la tabla SQL, pero Pydantic los leerá
    # de las funciones @property de models.Account
    total_pl: float
    current_percent: float

    outcome: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class DailyStat(BaseModel):
    date: str       # Formato "YYYY-MM-DD"
    profit: float
    trades_count: int
    wins: int
    losses: int

class CalendarResponse(BaseModel):
    month_total_profit: float
    month_win_rate: float
    total_trades: int
    days: List[DailyStat]

# --- SERVERS SCHEMAS ---
class ServerBase(BaseModel):
    name: str
    alias: str

class ServerCreate(ServerBase):
    pass

class ServerResponse(ServerBase):
    id: int
    active: bool
    model_config = ConfigDict(from_attributes=True)

class ChartDataPoint(BaseModel):
    date: str
    balance: float

class RiskMetrics(BaseModel):
    account_alias: str
    current_balance: float
    initial_balance: float
    
    # Drawdown
    is_trailing: bool
    max_drawdown_percent: float
    high_water_mark: float # Balance máximo alcanzado
    drawdown_limit_price: float # Precio donde pierdes la cuenta
    current_drawdown_amount: float # Dinero perdido desde el pico
    drawdown_progress: float # % de la barra roja (0 a 100)

    # Consistencia
    consistency_rule_percent: float
    highest_daily_profit: float
    profit_target_for_consistency: float
    consistency_progress: float # % de la barra verde
    is_in_drawdown: bool # Para poner la barra en 0 si pierde dinero

class DashboardStats(BaseModel):
    total_balance: float
    total_pl: float
    active_accounts: int
    win_rate: float
    recent_trades: List[TradeResponse]
    
    # NUEVO CAMPO: La curva de equidad
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

class AccountUpdate(BaseModel):
    alias: Optional[str] = None
    active: Optional[bool] = None
    loss_reason: Optional[str] = None
    outcome: Optional[str] = None

