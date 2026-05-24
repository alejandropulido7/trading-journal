from pydantic import BaseModel, ConfigDict
from typing import Optional

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


class AccountUpdate(BaseModel):
    alias: Optional[str] = None
    active: Optional[bool] = None
    loss_reason: Optional[str] = None
    outcome: Optional[str] = None