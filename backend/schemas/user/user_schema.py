from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(
        ..., 
        min_length=8, 
        max_length=72, 
        description="La contraseña no puede exceder los 72 caracteres"
    )

class Token(BaseModel):
    access_token: str
    token_type: str