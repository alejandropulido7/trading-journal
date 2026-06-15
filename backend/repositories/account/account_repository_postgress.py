from sqlalchemy.orm import Session
from typing import List, Optional
from core.exceptions import NotFoundError

from models.account.account_model import Account
from models import Trade
from repositories.account.i_account_repository import IAccountRepository

class PostgresAccountRepository(IAccountRepository):

    def __init__(self, db: Session):
        self.db = db

    def get_all(self, user_id: int) -> List[Account]:
        return self.db.query(Account).filter(Account.user_id == user_id).all()

    def get_by_id(self, account_id: int) -> Optional[Account]:
        account = self.db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise NotFoundError(entity_name="Cuenta", entity_id=account_id)
        return account

    def update(self, account: Account) -> Account:
        self.db.commit()
        self.db.refresh(account)
        return account
    
    def create(self, account: Account) -> Account:
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account
    
    def delete(self, account: Account, account_id: int) -> str:
        self.db.query(Trade).filter(Trade.account_id == account_id).delete()
        self.db.delete(account)
        self.db.commit
        return f"message: Cuenta {account.alias} eliminada correctamente"