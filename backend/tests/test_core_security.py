import pytest
from core.security import SecurityManager
from core.security_users import verify_password, get_password_hash, create_access_token, SECRET_KEY_USER, ALGORITHM
import jwt
from cryptography.fernet import Fernet

def test_fernet_encrypt_and_decrypt():
    # Test encryption and decryption with valid key
    sec = SecurityManager()
    plain = "MySecretTradingPassword123!"
    encrypted = sec.encrypt(plain)
    
    assert encrypted != plain
    assert isinstance(encrypted, str)
    
    decrypted = sec.decrypt(encrypted)
    assert decrypted == plain

def test_fernet_empty_strings():
    sec = SecurityManager()
    assert sec.encrypt("") == ""
    assert sec.decrypt("") == ""

def test_fernet_invalid_ciphertext_returns_original():
    sec = SecurityManager()
    unencrypted = "PlainOldPasswordNotEncrypted"
    result = sec.decrypt(unencrypted)
    # When decryption fails, it should fallback and return the original text
    assert result == unencrypted

def test_user_password_hashing_and_verification():
    password = "SuperSecurePassword999!"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_user_password_truncation_72_chars():
    # Long passwords should work reliably due to 72-char truncation
    long_pw = "A" * 100
    hashed = get_password_hash(long_pw)
    assert verify_password(long_pw, hashed) is True
    assert verify_password("A" * 72, hashed) is True
    assert verify_password("B" * 100, hashed) is False

def test_create_access_token():
    payload_data = {"sub": "42", "role": "trader"}
    token = create_access_token(payload_data)
    
    assert isinstance(token, str)
    
    decoded = jwt.decode(token, SECRET_KEY_USER, algorithms=[ALGORITHM])
    assert decoded["sub"] == "42"
    assert decoded["role"] == "trader"
    assert "exp" in decoded
