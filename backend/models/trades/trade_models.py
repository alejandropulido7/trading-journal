from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, BigInteger, UniqueConstraint
from sqlalchemy.orm import relationship
from config.postgres_database import Base

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
