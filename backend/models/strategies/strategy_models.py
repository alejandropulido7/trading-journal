from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from core.postgres_database import Base

class Strategy(Base):
    __tablename__ = "strategies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    description = Column(String, nullable=True)
    
    # Relación 1 a Muchos con StrategyItem
    items = relationship("StrategyItem", back_populates="strategy", cascade="all, delete-orphan")
    trades = relationship("Trade", back_populates="strategy")

class StrategyItem(Base):
    __tablename__ = "strategy_items"
    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id", ondelete="CASCADE"))
    condition = Column(String) # Ej: "RSI < 30" o "Rechazo de EMA 200"
    weight_percent = Column(Float) # Ej: 25.0
    
    strategy = relationship("Strategy", back_populates="items")
