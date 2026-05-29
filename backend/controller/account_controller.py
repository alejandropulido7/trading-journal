from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from config.postgres_database import get_db
from schemas.account.account_schema import AccountCreate, AccountResponse, AccountUpdate
from repositories.account.i_account_repository import IAccountRepository
from repositories.account.account_repository_postgress import PostgresAccountRepository
from services.account_service import AccountService
from config.dependencies import get_account_service

router = APIRouter(
    prefix="/accounts",
    tags=["Accounts"]
)

class AccountController:
    # El controlador SOLO pide el Servicio. No sabe de dónde viene ni qué BD usa.
    def __init__(self, service: AccountService = Depends(get_account_service)):
        self.service = service

    def get_accounts(self):
        return self.service.get_accounts()

    def update_account(self, account_id: int, data: AccountUpdate):
        return self.service.update_account_status(account_id, data)
    
    def create_account(self, data: AccountCreate):
        return self.service.create_account(data)
    
    def delete_account(self, account_id: int,):
        return self.service.delete_account(account_id)
    


@router.get("/", response_model=List[AccountResponse])
def get_accounts(controller: AccountController = Depends()):
    return controller.get_accounts()


@router.patch("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: int, 
    data: AccountUpdate, 
    controller: AccountController = Depends()
):
    return controller.update_account(account_id, data)


# 1. Registrar Cuenta
@router.post("/", response_model= AccountResponse)
def create_account(account_data: AccountCreate, 
                   controller: AccountController = Depends()):
    
    return controller.create_account(account_data)

# 2. Endpoint DELETE
@router.delete("/{account_id}")
def delete_account(account_id: int, controller: AccountController = Depends()):

    return controller.delete_account(account_id)
