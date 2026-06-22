from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from core.postgres_database import get_db
from schemas.user.user_schema import UserCreate, Token
from services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_user_service(db: Session = Depends(get_db)):
    return UserService(db)

@router.post("/register")
def register(user_data: UserCreate, service: UserService = Depends(get_user_service)):
    print(user_data)
    service.register_user(user_data)
    return {"message": "Usuario registrado con éxito"}

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    service: UserService = Depends(get_user_service)
):
    # form_data.username es el campo estandar de OAuth2 (aquí enviamos el email)
    return service.authenticate_user(form_data.username, form_data.password)