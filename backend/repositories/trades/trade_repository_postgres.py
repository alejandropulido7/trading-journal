from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date
from models_core import Trade, Emotion, Mistake, Strategy
from models.account.account_model import Account
from repositories.trades.i_trade_repository import ITradeRepository

class TradeRepositoryPostgres(ITradeRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, trade_date: Optional[date] = None) -> List[Trade]:
        query = self.db.query(Trade).join(Account)
        if trade_date:
            query = query.filter(func.date(Trade.close_time) == trade_date)
        return query.all()

    def get_by_id(self, trade_id: int) -> Optional[Trade]:
        return self.db.query(Trade).filter(Trade.id == trade_id).first()

    def update(self, trade: Trade) -> Trade:
        self.db.commit()
        self.db.refresh(trade)
        return trade

    def create(self, trade: Trade) -> Trade:
        self.db.add(trade)
        self.db.commit()
        self.db.refresh(trade)
        return trade

    def get_emotions(self) -> List[Emotion]:
        return self.db.query(Emotion).all()

    def get_mistakes(self) -> List[Mistake]:
        return self.db.query(Mistake).all()

    def get_strategies(self) -> List[Strategy]:
        return self.db.query(Strategy).options(selectinload(Strategy.items)).all()

    def get_trades_for_stats(self, account_id: Optional[int] = None) -> List[Trade]:
        query = self.db.query(Trade)
        if account_id:
            query = query.filter(Trade.account_id == account_id)
        else:
            # Filtramos por cuentas activas si no hay account_id
            active_accounts = self.db.query(Account.id).filter(Account.active == True).all()
            active_ids = [acc.id for acc in active_accounts]
            query = query.filter(Trade.account_id.in_(active_ids))
        return query.order_by(Trade.close_time).all()

    def get_trades_by_month(self, year: int, month: int, account_id: Optional[int] = None) -> List[Trade]:
        query = self.db.query(Trade).filter(
            extract('year', Trade.close_time) == year,
            extract('month', Trade.close_time) == month
        )
        if account_id:
            query = query.filter(Trade.account_id == account_id)
        return query.all()
