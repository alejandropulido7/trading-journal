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
import statistics

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
    print(account)
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

        trailing_drawdown = account.trailing_drawdown, # ¿Es trailing o estático?
        daily_drawdown_limit = account.daily_drawdown_limit,  # % (Ej: 5.0)
        max_drawdown_limit = account.max_drawdown_limit,    # % (Ej: 10.0)
        consistency_rule = account.consistency_rule,
        
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

# 2. Endpoint DELETE
@app.delete("/accounts/{account_id}")
def delete_account(account_id: int, db: Session = Depends(database.get_db)):
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    # Opcional: Borrar también los trades asociados
    db.query(models.Trade).filter(models.Trade.account_id == account_id).delete()
    
    db.delete(account)
    db.commit()
    return {"message": "Cuenta eliminada correctamente"}

@app.patch("/accounts/{account_id}", response_model=schemas.AccountResponse)
def update_account(account_id: int, account_update: schemas.AccountUpdate, db: Session = Depends(database.get_db)):
    db_account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    # Actualizamos solo los campos que vienen en el payload
    if account_update.alias is not None:
        db_account.alias = account_update.alias
    if account_update.active is not None:
        db_account.active = account_update.active
        
    db.commit()
    db.refresh(db_account)
    return db_account

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
            sync_date_str = last_trade_date.strftime("%Y-%m-%d 00:00:00")
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
    profits = [t.profit for t in all_trades]

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

    # 1. Básicos
    total_trades_count = len(profits)
    best_trade = max(profits) if profits else 0.0
    worst_trade = min(profits) if profits else 0.0
    
    wins = [p for p in profits if p > 0]
    losses = [p for p in profits if p < 0]
    
    avg_win = statistics.mean(wins) if wins else 0.0
    avg_loss = statistics.mean(losses) if losses else 0.0

    # 2. Profit Factor (Gross Profit / Gross Loss)
    gross_profit = sum(wins)
    gross_loss = abs(sum(losses))
    profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else 0.0

    # 3. Average RRR (Payoff Ratio: Avg Win / Avg Loss)
    # Nota: El RRR real requiere saber el SL inicial. Usamos Payoff Ratio como aproximación.
    average_rrr = round(avg_win / abs(avg_loss), 2) if avg_loss != 0 else 0.0

    # 4. Highest Profitable Day
    daily_sums = {}
    for t in all_trades:
        day = t.close_time.strftime("%Y-%m-%d")
        daily_sums[day] = daily_sums.get(day, 0) + t.profit
    
    highest_profitable_day = max(daily_sums.values()) if daily_sums else 0.0

    # 5. Sharpe Ratio (Simplificado por Trade)
    # Sharpe = Promedio Retorno / Desviación Estándar
    sharpe_ratio = 0.0
    if len(profits) > 1:
        stdev = statistics.stdev(profits)
        if stdev != 0:
            sharpe_ratio = round(statistics.mean(profits) / stdev, 2)

    # 6. Z-Score (Probabilidad de rachas)
    z_score = 0.0
    if len(profits) > 2:
        # Contamos "Runs" (Rachas: W W L L W = 3 rachas)
        runs = 0
        if total_trades_count > 0:
            runs = 1
            for i in range(1, total_trades_count):
                # Si el signo cambia, es una nueva racha
                prev_sign = 1 if profits[i-1] >= 0 else -1
                curr_sign = 1 if profits[i] >= 0 else -1
                if prev_sign != curr_sign:
                    runs += 1
        
        total_wins = len(wins)
        total_losses = len(losses)
        N = total_trades_count

        if total_wins > 0 and total_losses > 0:
            # Fórmula Z-Score de Trading
            x = 2 * total_wins * total_losses
            expected_runs = (x / N) + 1
            std_deviation = ((expected_runs - 1) * (expected_runs - 2)) / (N - 1)
            
            if std_deviation > 0:
                z_score = round((runs - expected_runs) / (std_deviation ** 0.5), 2)

    
    risk_metrics_list = []

    for acc in active_accounts:
        # 1. Obtener trades de ESTA cuenta para calcular su High Water Mark
        acc_trades = db.query(models.Trade).filter(models.Trade.account_id == acc.id).order_by(models.Trade.close_time).all()
        
        # Calcular curva de balance para hallar el High Water Mark (Pico más alto)
        temp_balance = acc.initial_balance
        high_water_mark = acc.initial_balance
        highest_daily_profit = 0.0
        
        # Mapa para consistencia (suma por días)
        daily_profits = {}

        for t in acc_trades:
            temp_balance += t.profit
            if temp_balance > high_water_mark:
                high_water_mark = temp_balance
            
            day_str = t.close_time.strftime("%Y-%m-%d")
            daily_profits[day_str] = daily_profits.get(day_str, 0) + t.profit

        if daily_profits:
            highest_daily_profit = max(daily_profits.values())

        # --- CÁLCULO DRAWDOWN ---
        # Límite máximo de pérdida
        if acc.trailing_drawdown:
            # Trailing: El límite sube con el High Water Mark
            # Límite = Pico Máximo - (Pico Máximo * %MaxDD)
            limit_price = high_water_mark - (high_water_mark * (acc.max_drawdown_limit / 100))
        else:
            # Estático: Basado en balance inicial
            limit_price = acc.initial_balance - (acc.initial_balance * (acc.max_drawdown_limit / 100))
        
        # Distancia actual al límite
        # Total espacio permitido = HWM - Límite (Trailing) o Inicial - Límite (Estático)
        if acc.trailing_drawdown:
            total_allowable_loss = high_water_mark * (acc.max_drawdown_limit / 100)
            current_loss_from_peak = high_water_mark - acc.balance
        else:
            total_allowable_loss = acc.initial_balance * (acc.max_drawdown_limit / 100)
            current_loss_from_peak = acc.initial_balance - acc.balance

        # Porcentaje de la barra roja (0% = a salvo, 100% = cuenta quemada)
        dd_progress = 0.0
        if total_allowable_loss > 0:
            dd_progress = (current_loss_from_peak / total_allowable_loss) * 100
        
        dd_progress = max(0.0, min(dd_progress, 100.0)) # Clampear entre 0 y 100

        # --- CÁLCULO CONSISTENCIA ---
        consistency_progress = 0.0
        target_profit = 0.0
        is_in_dd = acc.balance < acc.initial_balance

        if acc.consistency_rule > 0 and highest_daily_profit > 0 and not is_in_dd:
            # Regla: Mejor Día / % = Objetivo Total
            # Ej: 200 / 0.25 = 800 Objetivo
            target_profit = highest_daily_profit / (acc.consistency_rule / 100)
            
            current_profit = acc.balance - acc.initial_balance
            if target_profit > 0:
                consistency_progress = (current_profit / target_profit) * 100
            
            consistency_progress = max(0.0, min(consistency_progress, 100.0))
        
        risk_metrics_list.append({
            "account_alias": acc.alias,
            "current_balance": acc.balance,
            "initial_balance": acc.initial_balance,
            "is_trailing": acc.trailing_drawdown,
            "max_drawdown_percent": acc.max_drawdown_limit,
            "high_water_mark": high_water_mark,
            "drawdown_limit_price": limit_price,
            "current_drawdown_amount": current_loss_from_peak,
            "drawdown_progress": dd_progress,
            "consistency_rule_percent": acc.consistency_rule,
            "highest_daily_profit": highest_daily_profit,
            "profit_target_for_consistency": target_profit,
            "consistency_progress": consistency_progress,
            "is_in_drawdown": is_in_dd
        })

    return {
        # ... Tus campos existentes ...
        "total_balance": round(total_balance, 2),
        "total_pl": round(total_pl, 2),
        "active_accounts": count_active,
        "win_rate": round(win_rate, 2),
        "recent_trades": recent_trades_mapped,
        "balance_curve": balance_curve,

        # --- NUEVOS CAMPOS ---
        "best_trade": round(best_trade, 2),
        "worst_trade": round(worst_trade, 2),
        "average_win": round(avg_win, 2),
        "average_loss": round(avg_loss, 2),
        "highest_profitable_day": round(highest_profitable_day, 2),
        "total_trades_count": total_trades_count,
        "profit_factor": profit_factor,
        "average_rrr": average_rrr,
        "sharpe_ratio": sharpe_ratio,
        "z_score": z_score,
        "risk_metrics": risk_metrics_list
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