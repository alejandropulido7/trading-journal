from abc import ABC, abstractmethod
from typing import List, Optional
from models.account.account_model import Account

class IAccountRepository(ABC):
    
    @abstractmethod
    def get_all(self, user_id: int) -> List[Account]:
        """Recupera todas las cuentas"""
        pass
        
    @abstractmethod
    def get_by_id(self, account_id: int) -> Optional[Account]:
        """Busca una cuenta por su ID"""
        pass

    @abstractmethod
    def update(self, account: Account) -> Account:
        """Guarda los cambios de una cuenta en la base de datos"""
        pass

    @abstractmethod
    def create(self, account: Account) -> Account:
        """Crea una cuenta en la base de datos"""
        pass

    @abstractmethod
    def delete(self, account: Account, account_id: int) -> Account:
        """Crea una cuenta en la base de datos"""
        pass