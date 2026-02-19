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

class TradeResponse(TradeBase):
    id: int
    account_id: int
    
    # Campo extra para mostrar el nombre de la cuenta en las Cards del Frontend
    account_alias: Optional[str] = None 
    
    model_config = ConfigDict(from_attributes=True)

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
    
    # Estos campos NO están en la tabla SQL, pero Pydantic los leerá
    # de las funciones @property de models.Account
    total_pl: float
    current_percent: float
    
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