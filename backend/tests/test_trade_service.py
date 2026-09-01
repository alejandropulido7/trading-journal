import pytest
import datetime
from unittest.mock import MagicMock
from fastapi import HTTPException
from services.trade_service import TradeService
from schemas.trades.trade_schema import TradeAnalysisUpdate
from models.trades.trade_models import Trade
from models.account.account_model import Account
from models.user.user_model import User
from core.security import security

@pytest.fixture
def mock_dependencies():
    trade_repo = MagicMock()
    account_repo = MagicMock()
    retrieve_trades_repo = MagicMock()
    user = User(id=1, name="Test Trader", email="test@trader.com")
    return trade_repo, account_repo, retrieve_trades_repo, user

def test_trade_service_get_trades(mock_dependencies):
    trade_repo, account_repo, retrieve_trades_repo, user = mock_dependencies
    service = TradeService(trade_repo, account_repo, retrieve_trades_repo, user)
    
    trade_repo.get_all.return_value = [
        Trade(id=1, ticket=101, symbol="NAS100", type="BUY", profit=500.0, close_time=datetime.datetime.now())
    ]
    
    result = service.get_trades(start_date="2026-01-01", end_date="2026-01-31")
    assert len(result) == 1
    assert result[0].symbol == "NAS100"
    trade_repo.get_all.assert_called_once_with("2026-01-01", "2026-01-31", 1)

def test_trade_service_update_trade_analysis_success(mock_dependencies):
    trade_repo, account_repo, retrieve_trades_repo, user = mock_dependencies
    service = TradeService(trade_repo, account_repo, retrieve_trades_repo, user)
    
    db_trade = Trade(id=1, ticket=101, symbol="EURUSD", type="BUY", profit=150.0, close_time=datetime.datetime.now())
    trade_repo.get_by_id.return_value = db_trade
    trade_repo.update.side_effect = lambda t: t
    
    analysis_update = TradeAnalysisUpdate(
        emotion_id=2,
        mistake_id=1,
        strategy_id=3,
        trade_idea_id=5
    )
    
    updated = service.update_trade_analysis(1, analysis_update)
    assert updated.emotion_id == 2
    assert updated.mistake_id == 1
    assert updated.strategy_id == 3
    assert updated.trade_idea_id == 5
    trade_repo.update.assert_called_once_with(db_trade)

def test_trade_service_update_trade_analysis_not_found(mock_dependencies):
    trade_repo, account_repo, retrieve_trades_repo, user = mock_dependencies
    service = TradeService(trade_repo, account_repo, retrieve_trades_repo, user)
    trade_repo.get_by_id.return_value = None
    
    with pytest.raises(HTTPException) as exc_info:
        service.update_trade_analysis(999, TradeAnalysisUpdate())
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Trade no encontrado"

def test_trade_service_dashboard_stats_empty_trades(mock_dependencies):
    trade_repo, account_repo, retrieve_trades_repo, user = mock_dependencies
    service = TradeService(trade_repo, account_repo, retrieve_trades_repo, user)
    
    acc = Account(
        id=1,
        alias="Prop 1",
        initial_balance=100000.0,
        balance=100000.0,
        active=True,
        trailing_drawdown=False,
        max_drawdown_limit=10.0,
        consistency_rule=30.0,
        user_id=user.id
    )
    account_repo.get_all.return_value = [acc]
    trade_repo.get_trades_for_stats.return_value = []
    
    stats = service.get_dashboard_stats()
    
    assert stats.total_balance == 100000.0
    assert stats.total_pl == 0.0
    assert stats.active_accounts == 1
    assert stats.win_rate == 0.0
    assert stats.total_trades_count == 0
    assert stats.best_trade == 0.0
    assert stats.worst_trade == 0.0
    assert stats.profit_factor == 0.0
    assert stats.sharpe_ratio == 0.0
    assert stats.z_score == 0.0
    assert len(stats.risk_metrics) == 1
    assert stats.risk_metrics[0].drawdown_progress == 0.0

def test_trade_service_dashboard_stats_with_trades(mock_dependencies):
    trade_repo, account_repo, retrieve_trades_repo, user = mock_dependencies
    service = TradeService(trade_repo, account_repo, retrieve_trades_repo, user)
    
    acc = Account(
        id=1,
        alias="Apex 50k",
        initial_balance=50000.0,
        balance=52500.0,
        active=True,
        trailing_drawdown=True,
        max_drawdown_limit=5.0, # $2500 max DD
        consistency_rule=30.0,
        user_id=user.id
    )
    account_repo.get_all.return_value = [acc]
    
    d1 = datetime.datetime(2026, 1, 10, 10, 0, 0)
    d2 = datetime.datetime(2026, 1, 11, 11, 0, 0)
    d3 = datetime.datetime(2026, 1, 12, 14, 0, 0)
    d4 = datetime.datetime(2026, 1, 13, 15, 0, 0)
    
    trades = [
        Trade(id=1, ticket=1, account_id=1, account=acc, symbol="NQ", type="BUY", profit=1500.0, commission=-10.0, swap=0.0, close_time=d1),
        Trade(id=2, ticket=2, account_id=1, account=acc, symbol="NQ", type="SELL", profit=-500.0, commission=-10.0, swap=0.0, close_time=d2),
        Trade(id=3, ticket=3, account_id=1, account=acc, symbol="ES", type="BUY", profit=2000.0, commission=-10.0, swap=0.0, close_time=d3),
        Trade(id=4, ticket=4, account_id=1, account=acc, symbol="ES", type="SELL", profit=-500.0, commission=-10.0, swap=0.0, close_time=d4),
    ]
    trade_repo.get_trades_for_stats.return_value = trades
    
    stats = service.get_dashboard_stats()
    
    # 4 trades: 2 wins (1500, 2000), 2 losses (-500, -500)
    assert stats.total_trades_count == 4
    assert stats.win_rate == 50.0
    assert stats.best_trade == 2000.0
    assert stats.worst_trade == -500.0
    assert stats.average_win == 1750.0 # (1500 + 2000) / 2
    assert stats.average_loss == -500.0 # (-500 + -500) / 2
    assert stats.profit_factor == 3.5 # 3500 / 1000
    assert stats.average_rrr == 3.5 # 1750 / 500
    assert stats.active_accounts == 1
    assert len(stats.risk_metrics) == 1
    
    risk = stats.risk_metrics[0]
    assert risk.account_alias == "Apex 50k"
    assert risk.is_trailing is True
    assert risk.consistency_rule_percent == 30.0
    assert risk.highest_daily_profit == 2000.0
    # Consistency profit target = 2000 / (30/100) = 6666.67
    assert round(risk.profit_target_for_consistency, 2) == 6666.67
    # Current profit = 2500 -> progress = (2500 / 6666.666) * 100 = 37.5%
    assert round(risk.consistency_progress, 1) == 37.5

def test_trade_service_calendar_stats(mock_dependencies):
    trade_repo, account_repo, retrieve_trades_repo, user = mock_dependencies
    service = TradeService(trade_repo, account_repo, retrieve_trades_repo, user)
    
    d1 = datetime.datetime(2026, 2, 5, 12, 0, 0)
    d2 = datetime.datetime(2026, 2, 5, 14, 0, 0)
    d3 = datetime.datetime(2026, 2, 6, 10, 0, 0)
    
    trades = [
        Trade(id=1, ticket=1, account_id=1, symbol="EURUSD", type="BUY", profit=300.0, close_time=d1),
        Trade(id=2, ticket=2, account_id=1, symbol="EURUSD", type="SELL", profit=-100.0, close_time=d2),
        Trade(id=3, ticket=3, account_id=1, symbol="GBPUSD", type="BUY", profit=500.0, close_time=d3),
    ]
    trade_repo.get_trades_by_month.return_value = trades
    
    cal = service.get_calendar_stats(year=2026, month=2, account_id=1)
    
    assert cal.total_trades == 3
    assert cal.month_total_profit == 700.0 # 300 - 100 + 500
    assert round(cal.month_win_rate, 2) == 66.67 # 2 wins / 3 trades
    assert len(cal.days) == 2
    
    day1 = next(d for d in cal.days if d.date == "2026-02-05")
    assert day1.profit == 200.0
    assert day1.trades_count == 2
    assert day1.wins == 1
    assert day1.losses == 1
    
    day2 = next(d for d in cal.days if d.date == "2026-02-06")
    assert day2.profit == 500.0
    assert day2.trades_count == 1
    assert day2.wins == 1
    assert day2.losses == 0

def test_trade_service_sync_all_accounts_no_active_accounts(mock_dependencies):
    trade_repo, account_repo, retrieve_trades_repo, user = mock_dependencies
    service = TradeService(trade_repo, account_repo, retrieve_trades_repo, user)
    
    account_repo.get_all.return_value = []
    res = service.sync_all_accounts()
    assert res == {"message": "No hay cuentas activas para sincronizar"}

def test_trade_service_sync_all_accounts_success(mock_dependencies):
    trade_repo, account_repo, retrieve_trades_repo, user = mock_dependencies
    service = TradeService(trade_repo, account_repo, retrieve_trades_repo, user)
    
    acc = Account(
        id=1,
        login_id=112233,
        password=security.encrypt("mypassword"),
        server="FTMO-Server",
        alias="FTMO Account",
        balance=100000.0,
        active=True,
        start_date="2026-01-01",
        user_id=user.id
    )
    account_repo.get_all.return_value = [acc]
    trade_repo.get_trades_for_stats.return_value = []
    
    vps_mock_response = [
        {
            "account": 112233,
            "status": "success",
            "balance": 102450.0,
            "new_trades": [
                {
                    "ticket": 999901,
                    "position_id": 888801,
                    "symbol": "NAS100",
                    "type": "BUY",
                    "trade_date": "2026-02-10",
                    "entry_time": "09:35:00",
                    "exit_time": "10:15:00",
                    "profit": 2450.0,
                    "commission": -15.0,
                    "swap": 0.0,
                    "comment": "NY Sweep"
                }
            ]
        }
    ]
    retrieve_trades_repo.fetch_trades.return_value = vps_mock_response
    
    res = service.sync_all_accounts()
    
    assert res == {"status": "success", "new_trades_added": 1}
    assert acc.balance == 102450.0
    account_repo.update.assert_called_once_with(acc)
    trade_repo.create.assert_called_once()
