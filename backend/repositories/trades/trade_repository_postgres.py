from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date
from models import Trade, Emotion, Mistake, Strategy
from models.account.account_model import Account
from repositories.trades.i_trade_repository import ITradeRepository

class TradeRepositoryPostgres(ITradeRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, start_date: Optional[str] = None, 
                end_date: Optional[str] = None,
                user_id: int = None):

        query = (
            self.db.query(Trade)
            .join(Account, Trade.account_id == Account.id)
            .filter(Account.user_id == user_id)
        )
        
        if start_date:
            query = query.filter(Trade.open_time >= start_date)
        if end_date:
            # Le sumamos 23:59:59 al end_date para incluir todo el día final
            query = query.filter(Trade.open_time <= f"{end_date} 23:59:59")
            
        # Ordenamos del más reciente al más antiguo
        return query.order_by(Trade.open_time.desc()).all()

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

    def get_trades_for_stats(self, account_id: Optional[int] = None, user_id: int = None) -> List[Trade]:
        query = (
            self.db.query(Trade)
            .join(Account, Trade.account_id == Account.id)
            .filter(Account.user_id == user_id)
        )
        # query = self.db.query(Trade)
        if account_id:
            # Si piden una cuenta en específico, filtramos por ese ID
            query = query.filter(Trade.account_id == account_id)
        else:
            # Como ya hicimos el JOIN arriba, SQLAlchemy ya tiene cargada la tabla Account.
            # Simplemente le decimos que descarte las cuentas inactivas.
            query = query.filter(Account.active == True)
        return query.order_by(Trade.close_time).all()

    def get_trades_by_month(self, year: int, month: int, account_id: Optional[int] = None, user_id: int = None) -> List[Trade]:
        query = (
            self.db.query(Trade)
            .join(Account, Trade.account_id == Account.id)
            .filter(Account.user_id == user_id)
        ).filter(
            extract('year', Trade.close_time) == year,
            extract('month', Trade.close_time) == month
        )
        if account_id:
            query = query.filter(Trade.account_id == account_id)
        return query.all()
