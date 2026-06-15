from fastapi import Depends
from sqlalchemy.orm import Session

from repositories.strategies.i_strategy_repository import IStrategyRepository
from services.strategy_service import StrategyService
from repositories.strategies.postgres_strategy_repository import PostgresStrategyRepository
from core.postgres_database import get_db
from repositories.account.i_account_repository import IAccountRepository
from repositories.account.account_repository_postgress import PostgresAccountRepository
from services.account_service import AccountService

# 1. Ensamblamos el Repositorio (Aquí decidimos usar Postgres)
def get_account_repo(db: Session = Depends(get_db)) -> IAccountRepository:
    return PostgresAccountRepository(db)

# 2. Ensamblamos el Servicio
def get_account_service(repo: IAccountRepository = Depends(get_account_repo)) -> AccountService:
    return AccountService(repo)

# --- STRATEGIES ---
def get_strategy_repo(db: Session = Depends(get_db)) -> IStrategyRepository:
    return PostgresStrategyRepository(db)

def get_strategy_service(repo: IStrategyRepository = Depends(get_strategy_repo)) -> StrategyService:
    return StrategyService(repo)