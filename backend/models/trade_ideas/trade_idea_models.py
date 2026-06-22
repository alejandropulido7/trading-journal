import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from core.postgres_database import Base

class TradeIdea(Base):
    __tablename__ = "trade_ideas"
    id = Column(Integer, primary_key=True, index=True)
    asset = Column(String) # Ej: "EURUSD"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    strategy_id = Column(Integer, ForeignKey("strategies.id"))
    status = Column(String, default="DRAFT") # Puede ser DRAFT, EXECUTED, DISCARDED
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relaciones
    strategy = relationship("Strategy")
    # Relación con el checklist guardado
    checklist = relationship("TradeIdeaItem", back_populates="trade_idea", cascade="all, delete-orphan")
    # Relación con las fotos
    evidences = relationship("TimeframeEvidence", back_populates="trade_idea", cascade="all, delete-orphan")
    # Una idea puede resultar en uno o varios trades (ej. si haces re-entradas)
    trades = relationship("Trade", back_populates="trade_idea")
    owner = relationship("User")

class TradeIdeaItem(Base):
    """Guarda si el usuario marcó el checkbox y qué dirección eligió para una condición específica"""
    __tablename__ = "trade_idea_items"
    id = Column(Integer, primary_key=True, index=True)
    trade_idea_id = Column(Integer, ForeignKey("trade_ideas.id", ondelete="CASCADE"))
    strategy_item_id = Column(Integer, ForeignKey("strategy_items.id"))
    
    is_active = Column(Boolean, default=False)
    direction = Column(String, nullable=True) # "BUY" o "SELL"

    strategy_item = relationship("StrategyItem")
    trade_idea = relationship("TradeIdea", back_populates="checklist")

class TimeframeEvidence(Base):
    """Guarda las fotos y notas de cada temporalidad"""
    __tablename__ = "timeframe_evidences"
    id = Column(Integer, primary_key=True, index=True)
    trade_idea_id = Column(Integer, ForeignKey("trade_ideas.id", ondelete="CASCADE"))
    
    timeframe = Column(String) # Ej: "15M", "1H"
    note = Column(String)      # Nota del análisis
    image_url = Column(String) # Ruta de la imagen en tu VPS (ej: /uploads/ideas/idea_5_15M.png)

    trade_idea = relationship("TradeIdea", back_populates="evidences")
