import pytest
from unittest.mock import MagicMock
from services.user_service import UserService
from schemas.user.user_schema import UserCreate
from models.user.user_model import User
from core.exceptions import BusinessLogicError
from core.security_users import get_password_hash, verify_password

def test_user_service_register_user_success():
    mock_db = MagicMock()
    # No existing user
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    service = UserService(mock_db)
    user_data = UserCreate(email="trader@forex.com", password="Password123!", name="Forex Trader")
    
    created_user = service.register_user(user_data)
    
    assert created_user.email == "trader@forex.com"
    assert created_user.name == "Forex Trader"
    assert verify_password("Password123!", created_user.hashed_password) is True
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()

def test_user_service_register_user_duplicate_email():
    mock_db = MagicMock()
    # Existing user found
    existing_user = User(id=1, email="trader@forex.com", name="Existing Trader")
    mock_db.query.return_value.filter.return_value.first.return_value = existing_user
    
    service = UserService(mock_db)
    user_data = UserCreate(email="trader@forex.com", password="Password123!", name="Forex Trader")
    
    with pytest.raises(BusinessLogicError) as exc_info:
        service.register_user(user_data)
    assert exc_info.value.message == "El email ya está registrado"
    mock_db.add.assert_not_called()

def test_user_service_authenticate_user_success():
    mock_db = MagicMock()
    hashed = get_password_hash("ValidPassword123!")
    user = User(id=42, email="trader@forex.com", hashed_password=hashed)
    mock_db.query.return_value.filter.return_value.first.return_value = user
    
    service = UserService(mock_db)
    auth_result = service.authenticate_user("trader@forex.com", "ValidPassword123!")
    
    assert "access_token" in auth_result
    assert auth_result["token_type"] == "bearer"

def test_user_service_authenticate_user_wrong_password():
    mock_db = MagicMock()
    hashed = get_password_hash("ValidPassword123!")
    user = User(id=42, email="trader@forex.com", hashed_password=hashed)
    mock_db.query.return_value.filter.return_value.first.return_value = user
    
    service = UserService(mock_db)
    with pytest.raises(BusinessLogicError) as exc_info:
        service.authenticate_user("trader@forex.com", "WrongPassword!")
    assert exc_info.value.message == "Email o contraseña incorrectos"

def test_user_service_authenticate_user_user_not_found():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    service = UserService(mock_db)
    with pytest.raises(BusinessLogicError) as exc_info:
        service.authenticate_user("nonexistent@forex.com", "Password123!")
    assert exc_info.value.message == "Email o contraseña incorrectos"
