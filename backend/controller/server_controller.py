from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.postgres_database import get_db
from schemas.servers.server_schema import ServerResponse, ServerCreate
from models import Server
from core.dependencies_auth import get_current_user

router = APIRouter(
    prefix="/servers",
    tags=["Servers"],
    dependencies=[Depends(get_current_user)]
)

# GET: Listar todos
@router.get("/", response_model=List[ServerResponse], summary="List all servers")
def get_servers(db: Session = Depends(get_db)):
    """
    Returns a list of all trading servers configured in the system.
    """
    return db.query(Server).all()

# POST: Crear nuevo
@router.post("/", response_model=ServerResponse, summary="Create a new server")
def create_server(server: ServerCreate, db: Session = Depends(get_db)):
    """
    Registers a new trading server in the database.
    """
    # Verificar si ya existe
    existing = db.query(Server).filter(Server.name == server.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="El servidor ya existe")
    
    new_server = Server(
        name=server.name,
        alias=server.alias,
        active=True
    )
    db.add(new_server)
    db.commit()
    db.refresh(new_server)
    return new_server

# DELETE: Borrar
@router.delete("/{server_id}")
def delete_server(server_id: int, db: Session = Depends(get_db)):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Servidor no encontrado")
    
    db.delete(server)
    db.commit()
    return {"message": "Servidor eliminado"}