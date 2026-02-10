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
from datetime import date, timedelta
from sqlalchemy import func, desc
from sqlalchemy import extract
from security import security
from routers import servers

# Crear tablas al iniciar
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.include_router(servers.router)

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
    encrypted_password = security.encrypt(account.password)
    db_acc = models.Account(
        # Datos de conexión
        login_id=account.login_id,
        password=encrypted_password,
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
@app.get("/accounts/", response_model=List[schemas.AccountResponse])
def get_accounts(db: Session = Depends(database.get_db)):
    return db.query(models.Account).all()

# 3. LÓGICA DE SINCRONIZACIÓN (El botón mágico)
@app.post("/sync-all")
def sync_all_accounts(db: Session = Depends(database.get_db)):
    # 1. Obtener todas las cuentas activas locales
    local_accounts = db.query(models.Account).filter(models.Account.active == True).all()
    
    if not local_accounts:
        return {"message": "No hay cuentas activas para sincronizar"}

    # 2. Preparar el payload INTELIGENTE (Fecha por cuenta)
    accounts_payload = []
    
    for acc in local_accounts:
        # Buscamos la fecha del último trade cerrado registrado en NUESTRA base de datos para ESTA cuenta
        last_trade_date = db.query(func.max(models.Trade.close_time))\
                            .filter(models.Trade.account_id == acc.id)\
                            .scalar()
        
        # Si hay fecha, usamos esa. Si es cuenta nueva, usamos fecha antigua.
        # Le damos un margen de 1 minuto atrás para evitar perder trades por segundos
        if last_trade_date:
            sync_date_str = last_trade_date.strftime("%Y-%m-%d %H:%M:%S")
        else:
            sync_date_str = "2020-01-01 00:00:00"

        real_password = security.decrypt(acc.password)

        accounts_payload.append({
            "login": acc.login_id,
            "password": real_password,
            "server": acc.server,
            "last_sync_date": sync_date_str  # <--- AQUÍ ESTÁ LA MAGIA
        })

    # Payload final (Ya no enviamos last_sync_date global)
    payload = {
        "accounts": accounts_payload
    }

    # 3. LLAMAR A LA VPS
    try:
        response = requests.post(
            VPS_URL, 
            json=payload, 
            headers={"X-API-KEY": VPS_KEY}, 
            timeout=120 # Aumentamos timeout porque si hay muchas cuentas puede tardar
        )
        
        if response.status_code != 200:
            print(f"Error VPS: {response.text}")
            raise HTTPException(status_code=500, detail=f"Error VPS: {response.text}")
            
        vps_response = response.json()
        vps_data_list = vps_response.get("data", [])

    except Exception as e:
        print(f"🔥 Error conectando a VPS: {e}")
        raise HTTPException(status_code=500, detail="Error de conexión con VPS")

    total_new_trades = 0

    # 4. PROCESAR RESPUESTA
    for acc_json in vps_data_list:
        # Buscamos la cuenta local correspondiente
        current_db_acc = next((a for a in local_accounts if a.login_id == acc_json.get("account")), None)
        
        if not current_db_acc:
            continue

        # A. Actualizar Balance si viene correcto
        if acc_json.get("status") == "success" and "balance" in acc_json:
            current_db_acc.balance = acc_json["balance"]
        
        # B. Procesar Trades Nuevos
        new_trades_list = acc_json.get("new_trades", [])
        
        for t in new_trades_list:
            # Parseo de fechas (igual que antes)
            try:
                close_dt_str = f"{t['trade_date']} {t['exit_time']}"
                close_dt = datetime.datetime.strptime(close_dt_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                continue

            open_dt = None
            if t.get('entry_time'):
                try:
                    open_dt_str = f"{t['trade_date']} {t['entry_time']}"
                    open_dt = datetime.datetime.strptime(open_dt_str, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    pass

            # Evitar duplicados (Doble verificación)
            existing = db.query(models.Trade).filter(
                models.Trade.ticket == t["ticket"],
                models.Trade.account_id == current_db_acc.id
            ).first()

            if not existing:
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
        
        db.commit()
    print(f"Trades nuevos: {len(new_trades_list)}")
    return {"status": "success", "new_trades_added": len(new_trades_list)}

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

@app.get("/dashboard-stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    account_id: Optional[int] = None, 
    db: Session = Depends(database.get_db)
):
    # 1. Obtener cuentas activas (o la seleccionada)
    query_accounts = db.query(models.Account).filter(models.Account.active == True)
    if account_id:
        query_accounts = query_accounts.filter(models.Account.id == account_id)
    active_accounts = query_accounts.all()
    
    # Totales actuales
    total_balance = sum(acc.balance for acc in active_accounts)
    total_pl = sum(acc.balance - acc.initial_balance for acc in active_accounts)
    count_active = len(active_accounts)
    
    # 2. Win Rate y Trades
    query_trades = db.query(models.Trade)
    if account_id:
        query_trades = query_trades.filter(models.Trade.account_id == account_id)
    else:
        # Si es global, filtramos solo trades de cuentas activas para no ensuciar el gráfico con cuentas borradas
        active_ids = [acc.id for acc in active_accounts]
        query_trades = query_trades.filter(models.Trade.account_id.in_(active_ids))

    # --- LÓGICA DE LA CURVA DE EQUIDAD ---
    # a. Obtenemos el Balance Inicial Total
    global_initial_balance = sum(acc.initial_balance for acc in active_accounts)

    # b. Traemos TODOS los trades ordenados por fecha (ascendente) para ir sumando
    all_trades = query_trades.order_by(models.Trade.close_time).all()

    # c. Agrupamos profit por día
    daily_profit_map = {}
    if all_trades:
        # Encontramos el rango de fechas
        start_date = all_trades[0].close_time.date()
        end_date = datetime.datetime.now().date()
        
        # Llenamos el mapa con los trades
        for t in all_trades:
            d_str = t.close_time.strftime("%Y-%m-%d")
            daily_profit_map[d_str] = daily_profit_map.get(d_str, 0) + t.profit

    # d. Construimos la curva acumulativa
    balance_curve = []
    
    # Punto de partida (Día 0 o primer trade)
    current_running_balance = global_initial_balance
    
    # Si hay trades, generamos la línea de tiempo
    if all_trades:
        # Iteramos trade por trade o día por día.
        # Para que el gráfico se vea bonito (continuo), iteramos sobre las claves ordenadas
        sorted_dates = sorted(daily_profit_map.keys())
        
        # Agregamos un punto inicial (un día antes del primer trade) con el balance inicial
        first_date_dt = datetime.datetime.strptime(sorted_dates[0], "%Y-%m-%d")
        initial_point_date = (first_date_dt - timedelta(days=1)).strftime("%Y-%m-%d")
        
        balance_curve.append({
            "date": initial_point_date, 
            "balance": round(global_initial_balance, 2)
        })

        for d_str in sorted_dates:
            daily_pl = daily_profit_map[d_str]
            current_running_balance += daily_pl
            balance_curve.append({
                "date": d_str,
                "balance": round(current_running_balance, 2)
            })
    else:
        # Si no hay trades, mostramos una línea plana hoy
        balance_curve.append({
            "date": datetime.now().strftime("%Y-%m-%d"),
            "balance": round(global_initial_balance, 2)
        })

    # --- FIN LÓGICA CURVA ---

    # (El resto del código de win_rate y recent_trades sigue igual...)
    total_trades_count = query_trades.count()
    winning_trades_count = query_trades.filter(models.Trade.profit > 0).count()
    
    win_rate = 0.0
    if total_trades_count > 0:
        win_rate = (winning_trades_count / total_trades_count) * 100

    recent_trades_db = query_trades.join(models.Account).order_by(desc(models.Trade.close_time)).limit(5).all()
    
    recent_trades_mapped = []
    for t in recent_trades_db:
        t_resp = schemas.TradeResponse.model_validate(t)
        t_resp.account_alias = t.account.alias 
        recent_trades_mapped.append(t_resp)

    return {
        "total_balance": round(total_balance, 2),
        "total_pl": round(total_pl, 2),
        "active_accounts": count_active,
        "win_rate": round(win_rate, 2),
        "recent_trades": recent_trades_mapped,
        "balance_curve": balance_curve # <--- Retornamos la nueva lista
    }

@app.get("/calendar-stats", response_model=schemas.CalendarResponse)
def get_calendar_stats(
    year: int, 
    month: int, 
    account_id: Optional[int] = None, 
    db: Session = Depends(database.get_db)
):
    # 1. Consulta base: Trades cerrados en el año y mes solicitados
    query = db.query(models.Trade).filter(
        extract('year', models.Trade.close_time) == year,
        extract('month', models.Trade.close_time) == month
    )
    
    # 2. Filtro opcional por cuenta
    if account_id:
        query = query.filter(models.Trade.account_id == account_id)
    
    trades = query.all()
    
    # 3. Agrupación en Python (Más flexible que SQL puro para diccionarios)
    daily_map = {}
    
    total_profit = 0.0
    total_wins = 0
    total_count = len(trades)
    
    for t in trades:
        # Extraer fecha en string YYYY-MM-DD
        day_str = t.close_time.strftime("%Y-%m-%d")
        
        if day_str not in daily_map:
            daily_map[day_str] = {"profit": 0.0, "count": 0, "wins": 0, "losses": 0}
        
        # Acumular métricas del día
        daily_map[day_str]["profit"] += t.profit
        daily_map[day_str]["count"] += 1
        
        if t.profit >= 0:
            daily_map[day_str]["wins"] += 1
            total_wins += 1
        else:
            daily_map[day_str]["losses"] += 1
            
        # Acumular métricas del mes
        total_profit += t.profit

    # 4. Formatear respuesta
    days_list = []
    for date_key, data in daily_map.items():
        days_list.append(schemas.DailyStat(
            date=date_key,
            profit=round(data["profit"], 2),
            trades_count=data["count"],
            wins=data["wins"],
            losses=data["losses"]
        ))
        
    # Calcular Win Rate Mensual
    win_rate = 0.0
    if total_count > 0:
        win_rate = round((total_wins / total_count) * 100, 2)

    return {
        "month_total_profit": round(total_profit, 2),
        "month_win_rate": win_rate,
        "total_trades": total_count,
        "days": days_list
    }