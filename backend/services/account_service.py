from fastapi import HTTPException
from schemas.account.account_schema import AccountUpdate, AccountCreate
from repositories.account.i_account_repository import IAccountRepository
from models.account.account_model import Account
from config.security import security

class AccountService:

    def __init__(self, repo: IAccountRepository):
        self.repo = repo

    def get_accounts(self):
        return self.repo.get_all()

    def update_account_status(self, account_id: int, data: AccountUpdate):
        account = self.repo.get_by_id(account_id)        
        if data.active is not None:
            account.active = data.active
            if data.active is True:
                account.loss_reason = None
                account.outcome = None
                
        if data.loss_reason is not None: 
            account.loss_reason = data.loss_reason

        if data.outcome is not None: 
            account.outcome = data.outcome
            
        return self.repo.update(account)
    
    def delete_account(self, account_id: int):
        account = self.repo.get_by_id(account_id)
        return self.repo.delete(account, account_id)

    def create_account(self, account: AccountCreate):
        encrypted_password = security.encrypt(account.password)
        create_account = Account(
            # Datos de conexión
            login_id=account.login_id,
            password=encrypted_password,
            server=account.server,
            alias=account.alias,
            prop_firm=account.prop_firm,
            
            # Datos Financieros y Configuración
            account_type=account.account_type,
            initial_balance=account.initial_balance,
            
            # IMPORTANTE: Al crear la cuenta, el balance actual es igual al inicial
            balance=account.initial_balance, 
            
            risk_per_trade=account.risk_per_trade,
            target_percent=account.target_percent,
            investment=account.investment,

            trailing_drawdown = account.trailing_drawdown, # ¿Es trailing o estático?
            daily_drawdown_limit = account.daily_drawdown_limit,  # % (Ej: 5.0)
            max_drawdown_limit = account.max_drawdown_limit,    # % (Ej: 10.0)
            consistency_rule = account.consistency_rule,
            start_date=account.start_date,
            
            active=True 
        )
        return self.repo.create(create_account)