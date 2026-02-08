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
    
    # Estos campos NO están en la tabla SQL, pero Pydantic los leerá
    # de las funciones @property de models.Account
    total_pl: float
    current_percent: float
    
    model_config = ConfigDict(from_attributes=True)