from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import models, database, schemas
from pydantic import BaseModel
import requests
import os
import datetime
from fastapi.middleware.cors import CORSMiddleware
from datetime import date

# from fastapi import FastAPI, Depends, HTTPException
# from sqlalchemy.orm import Session
# from sqlalchemy import func
# from typing import List, Optional # <--- IMPORTANTE: Asegura que 'List' esté aquí
# from datetime import date
# import models, database, schemas # <--- IMPORTANTE: Asegura que 'schemas' esté aquí
# import requests
# import os
# from fastapi.middleware.cors import CORSMiddleware

# Crear tablas al iniciar
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Permitir estos orígenes
    allow_credentials=True,
    allow_methods=["*"],         # Permitir todos los métodos (GET, POST, etc)
    allow_headers=["*"],         # Permitir todos los headers
)

# --- CONFIGURACIÓN VPS ---
VPS_URL = os.getenv("VPS_MT5_URL")
VPS_KEY = os.getenv("VPS_API_KEY")

# --- SCHEMAS (Pydantic) ---
class AccountCreate(BaseModel):
    login_id: int
    password: str
    server: str
    alias: str
    prop_firm: str

class AccountResponse(AccountCreate):
    id: int
    balance: float
    last_sync: datetime.datetime = None # Calculado
    class Config:
        orm_mode = True

# --- ENDPOINTS ---

# 1. Registrar Cuenta
@app.post("/accounts/", response_model=schemas.AccountResponse)
def create_account(account: schemas.AccountCreate, db: Session = Depends(database.get_db)):
    db_acc = models.Account(
        # Datos de conexión
        login_id=account.login_id,
        password=account.password,
        server=account.server,
        alias=account.alias,
        prop_firm=account.prop_firm,
        
        # Datos Financieros y Configuración
        account_type=account.account_type,
        initial_balance=account.initial_balance,
        
        # IMPORTANTE: Al crear la cuenta, el balance actual es igual al inicial
        balance=account.initial_balance, 
        
        risk_per_trade=account.risk_per_trade,
        target_percent=account.target_percent,
        investment=account.investment,
        
        # Por defecto la cuenta nace activa
        active=True 
    )
    db.add(db_acc)
    db.commit()
    db.refresh(db_acc)
    return db_acc

# 2. Obtener Cuentas
@app.get("/accounts/")
def get_accounts(db: Session = Depends(database.get_db)):
    return db.query(models.Account).all()

# 3. LÓGICA DE SINCRONIZACIÓN (El botón mágico)
@app.post("/sync-all")
def sync_all_accounts(db: Session = Depends(database.get_db)):
    # 1. Obtener todas las cuentas locales
    local_accounts = db.query(models.Account).all()
    if not local_accounts:
        return {"message": "No hay cuentas registradas"}

    # 2. Preparar los datos para enviar a la VPS
    # La VPS necesita saber qué cuentas revisar (login, password, server)
    accounts_payload = []
    for acc in local_accounts:
        accounts_payload.append({
            "login": acc.login_id,
            "password": acc.password,
            "server": acc.server
        })

    # Calculamos una fecha base (puedes mejorar esto buscando la fecha máxima real)
    payload = {
        "accounts": accounts_payload,
        "last_sync_date": "2020-01-01 00:00:00" 
    }

    # 3. LLAMAR A LA VPS (Esto es lo que faltaba)
    try:
        response = requests.post(
            VPS_URL, 
            json=payload, 
            headers={"X-API-KEY": VPS_KEY}, 
            timeout=30
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Error VPS: {response.text}")
            
        vps_response = response.json()
        vps_data_list = vps_response.get("data", []) # Lista de resultados por cuenta

    except Exception as e:
        print(f"🔥 Error conectando a VPS: {e}")
        raise HTTPException(status_code=500, detail="Error de conexión con VPS")

    total_new_trades = 0

    # 4. PROCESAR LA RESPUESTA (Iteramos los datos que llegaron de la VPS)
    for acc_json in vps_data_list:
        # acc_json es un diccionario: {"account": 12345, "balance": 1000, "new_trades": [...]}
        
        # A. Encontrar la cuenta local que corresponde a este JSON
        # Buscamos en la lista local_accounts aquella cuyo login_id coincida
        current_db_acc = next((a for a in local_accounts if a.login_id == acc_json.get("account")), None)
        
        if not current_db_acc:
            continue # Si por alguna razón llega una cuenta que no tenemos, la saltamos

        # B. Actualizar Balance
        if "balance" in acc_json:
            current_db_acc.balance = acc_json["balance"]
        
        # C. Procesar Trades Nuevos
        new_trades_list = acc_json.get("new_trades", [])
        
        for t in new_trades_list:
            # Construcción de Fechas
            close_dt_str = f"{t['trade_date']} {t['exit_time']}"
            try:
                close_dt = datetime.datetime.strptime(close_dt_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                continue # Si la fecha viene mal, saltamos este trade

            open_dt = None
            if t.get('entry_time'):
                open_dt_str = f"{t['trade_date']} {t['entry_time']}"
                try:
                    open_dt = datetime.datetime.strptime(open_dt_str, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    open_dt = None

            # D. Verificar si ya existe el trade (Usando ticket + account_id)
            existing = db.query(models.Trade).filter(
                models.Trade.ticket == t["ticket"],
                models.Trade.account_id == current_db_acc.id # Usamos el ID interno
            ).first()

            if not existing:
                # Crear objeto Trade
                new_trade_db = models.Trade(
                    account_id=current_db_acc.id,
                    ticket=t["ticket"],
                    position_id=t.get("position_id"),
                    symbol=t["symbol"],
                    type=t["type"],
                    open_time=open_dt,
                    close_time=close_dt,
                    profit=t["profit"],
                    commission=t["commission"],
                    swap=t["swap"],
                    comment=t.get("comment")
                )
                db.add(new_trade_db)
                total_new_trades += 1
        
        # Guardamos cambios de esta cuenta
        db.commit()

    return {"status": "success", "new_trades_added": total_new_trades}

@app.get("/trades/", response_model=List[schemas.TradeResponse])
def get_trades_by_date(
    trade_date: Optional[date] = None, 
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Trade).join(models.Account)
    
    if trade_date:
        # Filtramos por close_time (convertimos a fecha)
        # Nota: En Postgres cast(models.Trade.close_time, Date)
        query = query.filter(func.date(models.Trade.close_time) == trade_date)
    
    trades = query.all()
    
    # Inyectamos el alias de la cuenta manualmente en la respuesta
    result = []
    for t in trades:
        t_resp = schemas.TradeResponse.model_validate(t)
        t_resp.account_alias = t.account.alias # Asignamos el nombre de la cuenta
        result.append(t_resp)
        
    return result