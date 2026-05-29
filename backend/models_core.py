from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, BigInteger, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from config.postgres_database import Base
import datetime

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
    emotion_id = Column(Integer, ForeignKey("emotions.id"), nullable=True)
    mistake_id = Column(Integer, ForeignKey("mistakes.id"), nullable=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=True)
    notes = Column(String, nullable=True)
    trade_idea_id = Column(Integer, ForeignKey("trade_ideas.id"), nullable=True)
    
    account = relationship("Account", back_populates="trades")
    emotion = relationship("Emotion", back_populates="trades")
    mistake = relationship("Mistake", back_populates="trades")
    strategy = relationship("Strategy", back_populates="trades")
    trade_idea = relationship("TradeIdea", back_populates="trades")

    __table_args__ = (
        UniqueConstraint('ticket', 'account_id', name='unique_trade_per_account'),
    )

class Server(Base):
    __tablename__ = "servers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # Ej: FundedNext-Server
    alias = Column(String) # Ej: FundedNext (Nombre bonito para mostrar)
    active = Column(Boolean, default=True)


class Emotion(Base):
    __tablename__ = "emotions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    
    trades = relationship("Trade", back_populates="emotion")

class Mistake(Base):
    __tablename__ = "mistakes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    
    trades = relationship("Trade", back_populates="mistake")

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

class TradeIdea(Base):
    __tablename__ = "trade_ideas"
    id = Column(Integer, primary_key=True, index=True)
    asset = Column(String) # Ej: "EURUSD"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    strategy_id = Column(Integer, ForeignKey("strategies.id"))
    status = Column(String, default="DRAFT") # Puede ser DRAFT, EXECUTED, DISCARDED
    
    # Relaciones
    strategy = relationship("Strategy")
    # Relación con el checklist guardado
    checklist = relationship("TradeIdeaItem", back_populates="trade_idea", cascade="all, delete-orphan")
    # Relación con las fotos
    evidences = relationship("TimeframeEvidence", back_populates="trade_idea", cascade="all, delete-orphan")
    # Una idea puede resultar en uno o varios trades (ej. si haces re-entradas)
    trades = relationship("Trade", back_populates="trade_idea")

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