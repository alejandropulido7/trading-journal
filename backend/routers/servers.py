from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import database, models, schemas

router = APIRouter(
    prefix="/servers",
    tags=["servers"]
)

# GET: Listar todos
@router.get("/", response_model=List[schemas.ServerResponse])
def get_servers(db: Session = Depends(database.get_db)):
    return db.query(models.Server).all()

# POST: Crear nuevo
@router.post("/", response_model=schemas.ServerResponse)
def create_server(server: schemas.ServerCreate, db: Session = Depends(database.get_db)):
    # Verificar si ya existe
    existing = db.query(models.Server).filter(models.Server.name == server.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="El servidor ya existe")
    
    new_server = models.Server(
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
def delete_server(server_id: int, db: Session = Depends(database.get_db)):
    server = db.query(models.Server).filter(models.Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Servidor no encontrado")
    
    db.delete(server)
    db.commit()
    return {"message": "Servidor eliminado"}