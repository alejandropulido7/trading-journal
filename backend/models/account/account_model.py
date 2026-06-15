from sqlalchemy import Column, Integer, String, Float, BigInteger, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from core.postgres_database import Base

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

    start_date = Column(String, default="2024-01-01")
    loss_reason = Column(String, nullable=True)
    outcome = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    trades = relationship("Trade", back_populates="account")
    owner = relationship("User", back_populates="accounts")

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