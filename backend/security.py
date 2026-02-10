# backend/security.py
from cryptography.fernet import Fernet
import os

class SecurityManager:
    def __init__(self):
        # En producción, esto debería venir de una variable de entorno
        # Por ahora, generamos/cargamos una clave localmente
        self.key_file = "secret.key"
        self.key = self._load_or_generate_key()
        self.cipher = Fernet(self.key)

    def _load_or_generate_key(self):
        if os.path.exists(self.key_file):
            with open(self.key_file, "rb") as key_file:
                return key_file.read()
        else:
            key = Fernet.generate_key()
            with open(self.key_file, "wb") as key_file:
                key_file.write(key)
            return key

    def encrypt(self, plain_text: str) -> str:
        """Encripta un texto plano a string encriptado"""
        if not plain_text: return ""
        return self.cipher.encrypt(plain_text.encode()).decode()

    def decrypt(self, encrypted_text: str) -> str:
        """Desencripta el string guardado a texto plano"""
        if not encrypted_text: return ""
        try:
            return self.cipher.decrypt(encrypted_text.encode()).decode()
        except Exception:
            # Si falla (ej: datos viejos no encriptados), devolvemos el original
            return encrypted_text

# Instancia global
security = SecurityManager()