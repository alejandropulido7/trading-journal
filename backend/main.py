from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import models, core.postgres_database as postgres_database
from fastapi.middleware.cors import CORSMiddleware
from controller import server_controller, account_controller, trade_controller, strategy_controller, trade_idea_controller, auth_controller
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
from core.exceptions import NotFoundError, BusinessLogicError

# Crear tablas al iniciar
postgres_database.Base.metadata.create_all(bind=postgres_database.engine)

# 1. Función para inyectar datos iniciales (Seeding)
def seed_initial_data(db: Session):
    # Emociones por defecto
    default_emotions = ["Neutral", "Confident", "FOMO", "Fear", "Greed", "Revenge", "Frustrated", "Impatient"]
    if db.query(models.Emotion).count() == 0:
        for e in default_emotions:
            db.add(models.Emotion(name=e))
            
    # Errores por defecto
    default_mistakes = ["None", "Moved Stop Loss", "Early Exit", "Late Entry", "Overleveraged", "Ignored Plan", "Forced Trade"]
    if db.query(models.Mistake).count() == 0:
        for m in default_mistakes:
            db.add(models.Mistake(name=m))
            
    db.commit()

# 2. Modificamos la creación de la app para que ejecute el seeding al iniciar
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Esto se ejecuta al arrancar
    db = postgres_database.SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    yield

app = FastAPI(lifespan=lifespan)

######## ROUTES #######
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(server_controller.router)
app.include_router(account_controller.router)
app.include_router(trade_controller.router)
app.include_router(strategy_controller.router)
app.include_router(trade_idea_controller.router)
app.include_router(auth_controller.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MANEJADORES GLOBALES DE EXCEPCIONES ---

@app.exception_handler(NotFoundError)
async def not_found_exception_handler(request: Request, exc: NotFoundError):
    return JSONResponse(
        status_code=404,
        content={"detail": exc.message, "error_type": "NOT_FOUND"},
    )

@app.exception_handler(BusinessLogicError)
async def business_logic_exception_handler(request: Request, exc: BusinessLogicError):
    return JSONResponse(
        status_code=400,
        content={"detail": exc.message, "error_type": "BUSINESS_RULE_VIOLATION"},
    )
