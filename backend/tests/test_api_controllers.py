import pytest
from models.account.account_model import Account
from models.strategies.strategy_models import Strategy, StrategyItem
from models.trade_ideas.trade_idea_models import TradeIdea
from models.trades.trade_models import Trade
from models.server.server_model import Server
from datetime import datetime

def test_auth_register_and_login_api(test_client):
    # 1. Register
    reg_payload = {
        "name": "Alex Trader",
        "email": "alex@trading.com",
        "password": "Password123!"
    }
    reg_res = test_client.post("/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    assert reg_res.json() == {"message": "Usuario registrado con éxito"}
    
    # Duplicate register should return 400 with BUSINESS_RULE_VIOLATION
    dup_res = test_client.post("/auth/register", json=reg_payload)
    assert dup_res.status_code == 400
    assert dup_res.json()["error_type"] == "BUSINESS_RULE_VIOLATION"
    
    # 2. Login
    login_data = {
        "username": "alex@trading.com",
        "password": "Password123!"
    }
    login_res = test_client.post("/auth/login", data=login_data)
    assert login_res.status_code == 200
    token_json = login_res.json()
    assert "access_token" in token_json
    assert token_json["token_type"] == "bearer"

def test_accounts_crud_api(test_client):
    # 1. Create account
    account_payload = {
        "login_id": 55443322,
        "password": "AccountPassword1",
        "server": "MetaQuotes-Demo",
        "alias": "My Big Prop",
        "prop_firm": "FTMO",
        "account_type": "Phase 1",
        "initial_balance": 100000.0,
        "risk_per_trade": 1.0,
        "target_percent": 10.0,
        "investment": 500.0,
        "trailing_drawdown": False,
        "daily_drawdown_limit": 5.0,
        "max_drawdown_limit": 10.0,
        "consistency_rule": 0.0,
        "start_date": "2026-01-01"
    }
    res = test_client.post("/accounts/", json=account_payload)
    assert res.status_code == 200
    data = res.json()
    acc_id = data["id"]
    assert data["alias"] == "My Big Prop"
    assert data["balance"] == 100000.0
    assert data["active"] is True
    
    # 2. Get accounts
    get_res = test_client.get("/accounts/")
    assert get_res.status_code == 200
    accounts = get_res.json()
    assert len(accounts) >= 1
    
    # 3. Update account
    patch_res = test_client.patch(f"/accounts/{acc_id}", json={"active": False, "loss_reason": "Max loss", "outcome": "Lost"})
    assert patch_res.status_code == 200
    assert patch_res.json()["active"] is False
    assert patch_res.json()["loss_reason"] == "Max loss"
    
    # 4. Delete account
    del_res = test_client.delete(f"/accounts/{acc_id}")
    assert del_res.status_code == 200

def test_strategies_crud_api(test_client):
    # 1. Create Strategy
    strat_payload = {
        "name": "ICT Silver Bullet",
        "description": "10-11 AM NY Killzone setup",
        "items": [
            {"condition": "Liquidity Run", "weight_percent": 50.0},
            {"condition": "Fair Value Gap Entry", "weight_percent": 50.0}
        ]
    }
    res = test_client.post("/strategies/", json=strat_payload)
    assert res.status_code == 200
    strat_id = res.json()["id"]
    assert res.json()["name"] == "ICT Silver Bullet"
    assert len(res.json()["items"]) == 2
    
    # Validation error: weight != 100
    bad_payload = {
        "name": "Bad Strategy",
        "items": [{"condition": "Invalid", "weight_percent": 20.0}]
    }
    bad_res = test_client.post("/strategies/", json=bad_payload)
    assert bad_res.status_code == 400
    assert bad_res.json()["error_type"] == "BUSINESS_RULE_VIOLATION"
    
    # 2. Get Strategy
    get_res = test_client.get(f"/strategies/{strat_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "ICT Silver Bullet"
    
    # 3. Update Strategy
    update_payload = {
        "name": "ICT Silver Bullet V2",
        "description": "Updated",
        "items": [{"condition": "All-in-one rule", "weight_percent": 100.0}]
    }
    put_res = test_client.put(f"/strategies/{strat_id}", json=update_payload)
    assert put_res.status_code == 200
    assert put_res.json()["name"] == "ICT Silver Bullet V2"
    
    # 4. Delete Strategy
    del_res = test_client.delete(f"/strategies/{strat_id}")
    assert del_res.status_code == 200
    
    # 5. Not found check
    nf_res = test_client.get(f"/strategies/{strat_id}")
    assert nf_res.status_code == 404
    assert nf_res.json()["error_type"] == "NOT_FOUND"

def test_servers_api(test_client):
    # 1. Create server
    srv_payload = {
        "name": "FundedNext-Demo",
        "alias": "FundedNext Demo Server"
    }
    res = test_client.post("/servers/", json=srv_payload)
    assert res.status_code == 200
    srv_id = res.json()["id"]
    assert res.json()["name"] == "FundedNext-Demo"
    
    # 2. List servers
    list_res = test_client.get("/servers/")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
    
    # 3. Delete server
    del_res = test_client.delete(f"/servers/{srv_id}")
    assert del_res.status_code == 200

def test_trades_api(test_client, test_account, db_session):
    # Create sample trade
    trade = Trade(
        account_id=test_account.id,
        ticket=778899,
        symbol="NAS100",
        type="BUY",
        close_time=datetime(2026, 1, 15, 16, 30),
        profit=450.0,
        commission=-10.0,
        swap=0.0
    )
    db_session.add(trade)
    db_session.commit()
    
    # 1. Get trades
    get_res = test_client.get("/trades/")
    assert get_res.status_code == 200
    trades = get_res.json()
    assert len(trades) >= 1
    
    # 2. Patch analysis
    patch_res = test_client.patch(f"/trades/{trade.id}", json={"emotion_id": 1, "mistake_id": 1})
    assert patch_res.status_code == 200
    
    # 3. Get Dashboard Stats
    stats_res = test_client.get("/trades/dashboard-stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_balance" in stats
    assert "win_rate" in stats
    assert "risk_metrics" in stats
    
    # 4. Get Calendar Stats
    cal_res = test_client.get("/trades/calendar-stats?year=2026&month=1")
    assert cal_res.status_code == 200
    cal_data = cal_res.json()
    assert "month_total_profit" in cal_data
    
    # 5. Get Emotions & Mistakes
    emotions_res = test_client.get("/trades/emotions/")
    assert emotions_res.status_code == 200
    mistakes_res = test_client.get("/trades/mistakes/")
    assert mistakes_res.status_code == 200

def test_trade_ideas_api(test_client, test_strategy):
    # 1. Create Trade Idea
    idea_payload = {
        "asset": "EURUSD",
        "strategy_id": test_strategy.id,
        "checklist": [
            {"strategy_item_id": test_strategy.items[0].id, "is_active": True, "direction": "BUY"}
        ]
    }
    res = test_client.post("/trade-ideas/", json=idea_payload)
    assert res.status_code == 200
    idea_id = res.json()["id"]
    assert res.json()["asset"] == "EURUSD"
    assert res.json()["status"] == "DRAFT"
    
    # 2. Get Trade Ideas
    get_res = test_client.get("/trade-ideas/")
    assert get_res.status_code == 200
    assert len(get_res.json()) >= 1
    
    # 3. Patch Status
    patch_res = test_client.patch(f"/trade-ideas/{idea_id}/status", json={"status": "EXECUTED"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "EXECUTED"
    
    # 4. Delete Trade Idea
    del_res = test_client.delete(f"/trade-ideas/{idea_id}")
    assert del_res.status_code == 200
