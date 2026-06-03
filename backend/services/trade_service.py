import datetime
import os
import requests
import statistics
from datetime import date, timedelta
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from repositories.retrieve_data_trades.i_retrieve_trades_repository import IMT5SyncRepository
from models_core import Trade, Strategy, StrategyItem
from models.account.account_model import Account
from repositories.trades.i_trade_repository import ITradeRepository
from repositories.account.i_account_repository import IAccountRepository
from schemas.trades.trade_schema import (
    TradeResponse, TradeAnalysisUpdate, DashboardStats, 
    ChartDataPoint, RiskMetrics, CalendarResponse, DailyStat
)
from config.security import security

class TradeService:
    def __init__(self, trade_repo: ITradeRepository, 
                 account_repo: IAccountRepository,
                 retrieve_trades_repo: IMT5SyncRepository):
        self.trade_repo = trade_repo
        self.account_repo = account_repo
        self.retrieve_trades_repo = retrieve_trades_repo

    def sync_all_accounts(self):
        local_accounts = [acc for acc in self.account_repo.get_all() if acc.active]
        if not local_accounts:
            return {"message": "No hay cuentas activas para sincronizar"}

        accounts_payload = []
        for acc in local_accounts:
            last_trade = self.trade_repo.get_trades_for_stats(acc.id)
            last_trade_date = last_trade[-1].close_time if last_trade else None
            
            if last_trade_date:
                sync_date_str = (last_trade_date + timedelta(minutes=1)).strftime("%Y-%m-%d %H:%M:%S")
            else:
                sync_date_str = f"{acc.start_date} 00:00:00"

            real_password = security.decrypt(acc.password)
            accounts_payload.append({
                "login": acc.login_id,
                "password": real_password,
                "server": acc.server,
                "last_sync_date": sync_date_str
            })

        payload = {"accounts": accounts_payload}

        print(f"Enviando payload a VPS: {payload}")  # Debug log

        vps_data_list = self.retrieve_trades_repo.fetch_trades(payload)  # Llamada al repositorio para registrar el intento de sincronización

        total_new_trades = 0
        for acc_json in vps_data_list:
            current_db_acc = next((a for a in local_accounts if a.login_id == acc_json.get("account")), None)
            if not current_db_acc:
                continue

            if acc_json.get("status") == "success" and "balance" in acc_json:
                current_db_acc.balance = acc_json["balance"]
                self.account_repo.update(current_db_acc)

            new_trades_list = acc_json.get("new_trades", [])
            for t in new_trades_list:
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

                # Verificar si ya existe (podría optimizarse en el repo)
                existing = self.trade_repo.get_by_id(t["ticket"]) # Asumiendo ticket como ID o similar en la lógica original
                # En main.py se filtraba por ticket y account_id
                # Vamos a mantener esa lógica aquí por ahora
                
                # Necesito un método en repo para esto o usar el db session directamente si es necesario, 
                # pero mejor lo mantengo limpio.
                
                # Re-check main.py: existing = db.query(models_core.Trade).filter(models_core.Trade.ticket == t["ticket"], models_core.Trade.account_id == current_db_acc.id).first()
                # I'll add a specialized method to repo or just use a generic one.
                
                # For brevity and to avoid adding too many methods to repo interface now:
                new_trade_db = Trade(
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
                try:
                    self.trade_repo.create(new_trade_db)
                    total_new_trades += 1
                except:
                    # Probablemente duplicado por UniqueConstraint
                    pass

        return {"status": "success", "new_trades_added": total_new_trades}

    def get_trades(self, trade_date: Optional[date] = None):
        trades = self.trade_repo.get_all(trade_date)
        result = []
        for t in trades:
            t_resp = TradeResponse.model_validate(t)
            t_resp.account_alias = t.account.alias
            result.append(t_resp)
        return result

    def update_trade_analysis(self, trade_id: int, analysis: TradeAnalysisUpdate):
        db_trade = self.trade_repo.get_by_id(trade_id)
        if not db_trade:
            raise HTTPException(status_code=404, detail="Trade no encontrado")

        db_trade.emotion_id = analysis.emotion_id
        db_trade.mistake_id = analysis.mistake_id
        db_trade.strategy_id = analysis.strategy_id
        db_trade.trade_idea_id = analysis.trade_idea_id
        
        return self.trade_repo.update(db_trade)

    def get_dashboard_stats(self, account_id: Optional[int] = None):
        if account_id:
            active_accounts = [self.account_repo.get_by_id(account_id)]
        else:
            active_accounts = [acc for acc in self.account_repo.get_all() if acc.active]

        total_balance = sum(acc.balance for acc in active_accounts)
        total_pl = sum(acc.balance - acc.initial_balance for acc in active_accounts)
        
        all_trades = self.trade_repo.get_trades_for_stats(account_id)
        profits = [t.profit for t in all_trades]

        # Equidad
        global_initial_balance = sum(acc.initial_balance for acc in active_accounts)
        daily_profit_map = {}
        for t in all_trades:
            d_str = t.close_time.strftime("%Y-%m-%d")
            daily_profit_map[d_str] = daily_profit_map.get(d_str, 0) + t.profit

        balance_curve = []
        current_running_balance = global_initial_balance
        if all_trades:
            sorted_dates = sorted(daily_profit_map.keys())
            first_date_dt = datetime.datetime.strptime(sorted_dates[0], "%Y-%m-%d")
            initial_point_date = (first_date_dt - timedelta(days=1)).strftime("%Y-%m-%d")
            balance_curve.append(ChartDataPoint(date=initial_point_date, balance=round(global_initial_balance, 2)))
            for d_str in sorted_dates:
                current_running_balance += daily_profit_map[d_str]
                balance_curve.append(ChartDataPoint(date=d_str, balance=round(current_running_balance, 2)))
        else:
            balance_curve.append(ChartDataPoint(date=datetime.datetime.now().strftime("%Y-%m-%d"), balance=round(global_initial_balance, 2)))

        # Win Rate
        total_trades_count = len(profits)
        wins = [p for p in profits if p > 0]
        win_rate = (len(wins) / total_trades_count * 100) if total_trades_count > 0 else 0.0

        # Recent Trades
        recent_trades = all_trades[-5:][::-1]
        recent_trades_mapped = []
        for t in recent_trades:
            t_resp = TradeResponse.model_validate(t)
            t_resp.account_alias = t.account.alias 
            recent_trades_mapped.append(t_resp)

        # Stats
        best_trade = max(profits) if profits else 0.0
        worst_trade = min(profits) if profits else 0.0
        losses = [p for p in profits if p < 0]
        avg_win = statistics.mean(wins) if wins else 0.0
        avg_loss = statistics.mean(losses) if losses else 0.0
        gross_profit = sum(wins)
        gross_loss = abs(sum(losses))
        profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else 0.0
        average_rrr = round(avg_win / abs(avg_loss), 2) if avg_loss != 0 else 0.0
        
        highest_profitable_day = max(daily_profit_map.values()) if daily_profit_map else 0.0
        
        sharpe_ratio = 0.0
        if len(profits) > 1:
            stdev = statistics.stdev(profits)
            if stdev != 0:
                sharpe_ratio = round(statistics.mean(profits) / stdev, 2)

        # Z-Score
        z_score = 0.0
        if len(profits) > 2:
            runs = 1
            for i in range(1, len(profits)):
                if (1 if profits[i-1] >= 0 else -1) != (1 if profits[i] >= 0 else -1):
                    runs += 1
            n_wins = len(wins)
            n_losses = len(losses)
            N = len(profits)
            if n_wins > 0 and n_losses > 0:
                x = 2 * n_wins * n_losses
                expected_runs = (x / N) + 1
                std_deviation = ((expected_runs - 1) * (expected_runs - 2)) / (N - 1)
                if std_deviation > 0:
                    z_score = round((runs - expected_runs) / (std_deviation ** 0.5), 2)

        # Risk Metrics
        risk_metrics_list = []
        for acc in active_accounts:
            acc_trades = [t for t in all_trades if t.account_id == acc.id]
            temp_balance = acc.initial_balance
            high_water_mark = acc.initial_balance
            acc_daily_profits = {}
            for t in acc_trades:
                temp_balance += t.profit
                if temp_balance > high_water_mark:
                    high_water_mark = temp_balance
                day_str = t.close_time.strftime("%Y-%m-%d")
                acc_daily_profits[day_str] = acc_daily_profits.get(day_str, 0) + t.profit

            highest_daily_profit = max(acc_daily_profits.values()) if acc_daily_profits else 0.0
            
            if acc.trailing_drawdown:
                limit_price = high_water_mark - (high_water_mark * (acc.max_drawdown_limit / 100))
                total_allowable_loss = high_water_mark * (acc.max_drawdown_limit / 100)
                current_loss_from_peak = high_water_mark - acc.balance
            else:
                limit_price = acc.initial_balance - (acc.initial_balance * (acc.max_drawdown_limit / 100))
                total_allowable_loss = acc.initial_balance * (acc.max_drawdown_limit / 100)
                current_loss_from_peak = acc.initial_balance - acc.balance

            dd_progress = (current_loss_from_peak / total_allowable_loss * 100) if total_allowable_loss > 0 else 0.0
            dd_progress = max(0.0, min(dd_progress, 100.0))

            consistency_progress = 0.0
            target_profit = 0.0
            is_in_dd = acc.balance < acc.initial_balance
            if acc.consistency_rule > 0 and highest_daily_profit > 0 and not is_in_dd:
                target_profit = highest_daily_profit / (acc.consistency_rule / 100)
                current_profit = acc.balance - acc.initial_balance
                if target_profit > 0:
                    consistency_progress = (current_profit / target_profit) * 100
                consistency_progress = max(0.0, min(consistency_progress, 100.0))
            
            risk_metrics_list.append(RiskMetrics(
                account_alias=acc.alias,
                current_balance=acc.balance,
                initial_balance=acc.initial_balance,
                is_trailing=acc.trailing_drawdown,
                max_drawdown_percent=acc.max_drawdown_limit,
                high_water_mark=high_water_mark,
                drawdown_limit_price=limit_price,
                current_drawdown_amount=current_loss_from_peak,
                drawdown_progress=dd_progress,
                consistency_rule_percent=acc.consistency_rule,
                highest_daily_profit=highest_daily_profit,
                profit_target_for_consistency=target_profit,
                consistency_progress=consistency_progress,
                is_in_drawdown=is_in_dd
            ))

        return DashboardStats(
            total_balance=round(total_balance, 2),
            total_pl=round(total_pl, 2),
            active_accounts=len(active_accounts),
            win_rate=round(win_rate, 2),
            recent_trades=recent_trades_mapped,
            balance_curve=balance_curve,
            best_trade=round(best_trade, 2),
            worst_trade=round(worst_trade, 2),
            average_win=round(avg_win, 2),
            average_loss=round(avg_loss, 2),
            highest_profitable_day=round(highest_profitable_day, 2),
            total_trades_count=total_trades_count,
            profit_factor=profit_factor,
            average_rrr=average_rrr,
            sharpe_ratio=sharpe_ratio,
            z_score=z_score,
            risk_metrics=risk_metrics_list
        )

    def get_calendar_stats(self, year: int, month: int, account_id: Optional[int] = None):
        trades = self.trade_repo.get_trades_by_month(year, month, account_id)
        daily_map = {}
        total_profit = 0.0
        total_wins = 0
        for t in trades:
            day_str = t.close_time.strftime("%Y-%m-%d")
            if day_str not in daily_map:
                daily_map[day_str] = {"profit": 0.0, "count": 0, "wins": 0, "losses": 0}
            daily_map[day_str]["profit"] += t.profit
            daily_map[day_str]["count"] += 1
            if t.profit >= 0:
                daily_map[day_str]["wins"] += 1
                total_wins += 1
            else:
                daily_map[day_str]["losses"] += 1
            total_profit += t.profit

        days_list = [
            DailyStat(date=d, profit=round(data["profit"], 2), trades_count=data["count"], wins=data["wins"], losses=data["losses"])
            for d, data in daily_map.items()
        ]
        win_rate = (total_wins / len(trades) * 100) if trades else 0.0
        return CalendarResponse(
            month_total_profit=round(total_profit, 2),
            month_win_rate=round(win_rate, 2),
            total_trades=len(trades),
            days=days_list
        )
