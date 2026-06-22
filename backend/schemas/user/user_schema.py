from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    name: str
    email: str
    password: str = Field(
        ..., 
        min_length=2, 
        max_length=72, 
        description="La contraseña no puede exceder los 72 caracteres"
    )

class Token(BaseModel):
    access_token: str
    token_type: str