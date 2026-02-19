from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, BigInteger, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    login_id = Column(BigInteger, unique=True, index=True)
    password = Column(String)
    server = Column(String)
    
    # Identificación
    alias = Column(String)
    prop_firm = Column(String)
    account_type = Column(String) # Phase 1, Phase 2, Funded
    
    # Datos Financieros
    initial_balance = Column(Float, default=0.0) 
    balance = Column(Float, default=0.0)         # Balance actual (se actualiza al sincronizar)
    risk_per_trade = Column(Float, default=1.0)
    target_percent = Column(Float, default=0.0)
    investment = Column(Float, default=0.0)

    #Drawdown and target
    trailing_drawdown = Column(Boolean, default=False) # ¿Es trailing o estático?
    daily_drawdown_limit = Column(Float, default=0.0)  # % (Ej: 5.0)
    max_drawdown_limit = Column(Float, default=0.0)    # % (Ej: 10.0)
    consistency_rule = Column(Float, default=0.0)
    
    # Estado
    active = Column(Boolean, default=True)
    
    trades = relationship("Trade", back_populates="account")

    # --- LÓGICA DE NEGOCIO (Calculados al vuelo) ---
    @property
    def total_pl(self):
        """Calcula Ganancia/Pérdida neta"""
        return round(self.balance - self.initial_balance, 2)

    @property
    def current_percent(self):
        """Calcula el % de crecimiento"""
        if self.initial_balance == 0:
            return 0.0
        pl = self.balance - self.initial_balance
        return round((pl / self.initial_balance) * 100, 2)

class Trade(Base):
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    
    ticket = Column(BigInteger, nullable=False)
    position_id = Column(BigInteger, nullable=True)
    symbol = Column(String)
    type = Column(String)
    
    open_time = Column(DateTime, nullable=True)
    close_time = Column(DateTime, nullable=False)
    
    profit = Column(Float)
    commission = Column(Float)
    swap = Column(Float)
    comment = Column(String, nullable=True)
    
    # Journaling
    strategy = Column(String, nullable=True)
    emotion = Column(String, nullable=True)
    mistake = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    
    account = relationship("Account", back_populates="trades")

    __table_args__ = (
        UniqueConstraint('ticket', 'account_id', name='unique_trade_per_account'),
    )

class Server(Base):
    __tablename__ = "servers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # Ej: FundedNext-Server
    alias = Column(String) # Ej: FundedNext (Nombre bonito para mostrar)
    active = Column(Boolean, default=True)