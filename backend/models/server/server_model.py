from sqlalchemy import Column, Integer, String, Boolean
from config.postgres_database import Base

class Server(Base):
    __tablename__ = "servers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # Ej: FundedNext-Server
    alias = Column(String) # Ej: FundedNext (Nombre bonito para mostrar)
    active = Column(Boolean, default=True)
