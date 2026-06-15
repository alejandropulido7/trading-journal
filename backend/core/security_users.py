import bcrypt  # <-- Importamos bcrypt directo, adiós passlib
import jwt
from datetime import datetime, timedelta

SECRET_KEY_USER = "tu_super_clave_secreta_super_segura"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica usando bcrypt puro"""
    # Cortamos a 72 caracteres por seguridad extrema y convertimos a bytes
    safe_password = plain_password[:72].encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    
    return bcrypt.checkpw(safe_password, hashed_bytes)

def get_password_hash(password: str) -> str:
    """Hashea usando bcrypt puro"""
    # Cortamos a 72 caracteres y convertimos a bytes
    safe_password = password[:72].encode('utf-8')
    
    # Generamos la "sal" y el hash nativo
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(safe_password, salt)
    
    # Lo devolvemos como string normal para guardarlo en PostgreSQL
    return hashed_bytes.decode('utf-8')

def create_access_token(data: dict):
    # ... tu código de JWT sigue exactamente igual ...
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY_USER, algorithm=ALGORITHM)
    return encoded_jwt