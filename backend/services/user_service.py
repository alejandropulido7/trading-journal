from sqlalchemy.orm import Session
from models.user.user_model import User
from schemas.user.user_schema import UserCreate
from core.security_users import get_password_hash, verify_password, create_access_token
from core.exceptions import BusinessLogicError

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def register_user(self, user_data: UserCreate):
        # 1. Verificar si existe
        if self.db.query(User).filter(User.email == user_data.email).first():
            raise BusinessLogicError("El email ya está registrado")
            
        # 2. Encriptar y guardar
        hashed_pw = get_password_hash(user_data.password)
        db_user = User(email=user_data.email, hashed_password=hashed_pw)
        self.db.add(db_user)
        self.db.commit()
        return db_user

    def authenticate_user(self, email: str, password: str):
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.hashed_password):
            raise BusinessLogicError("Email o contraseña incorrectos")
            
        # Generar Token JWT
        access_token = create_access_token(data={"sub": str(user.id)})
        return {"access_token": access_token, "token_type": "bearer"}