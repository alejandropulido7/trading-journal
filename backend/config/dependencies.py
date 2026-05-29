from fastapi import Depends
from sqlalchemy.orm import Session

from config.postgres_database import get_db
from repositories.account.i_account_repository import IAccountRepository
from repositories.account.account_repository_postgress import PostgresAccountRepository
from services.account_service import AccountService

# 1. Ensamblamos el Repositorio (Aquí decidimos usar Postgres)
def get_account_repo(db: Session = Depends(get_db)) -> IAccountRepository:
    return PostgresAccountRepository(db)

# 2. Ensamblamos el Servicio
def get_account_service(repo: IAccountRepository = Depends(get_account_repo)) -> AccountService:
    return AccountService(repo)