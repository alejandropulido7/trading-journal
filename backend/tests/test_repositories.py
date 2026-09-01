import pytest
from datetime import datetime
from repositories.account.account_repository_postgress import PostgresAccountRepository
from repositories.strategies.postgres_strategy_repository import PostgresStrategyRepository
from repositories.trade_ideas.trade_idea_repository_postgres import PostgresTradeIdeaRepository
from repositories.trades.trade_repository_postgres import TradeRepositoryPostgres
from repositories.retrieve_data_trades.mt5_sync_repository import MT5SyncRepository
from models.account.account_model import Account
from models.strategies.strategy_models import Strategy, StrategyItem
from models.trade_ideas.trade_idea_models import TradeIdea, TimeframeEvidence
from models.trades.trade_models import Trade, Emotion, Mistake
from core.exceptions import NotFoundError
from fastapi import HTTPException
from unittest.mock import patch, MagicMock

def test_postgres_account_repository(db_session, test_user):
    repo = PostgresAccountRepository(db_session)
    
    # Create
    acc = Account(
        login_id=999888,
        password="enc_password",
        server="Test-Server",
        alias="Demo Account",
        prop_firm="MyForexFunds",
        account_type="Evaluation",
        initial_balance=25000.0,
        balance=25000.0,
        user_id=test_user.id
    )
    created = repo.create(acc)
    assert created.id is not None
    
    # Get by ID
    found = repo.get_by_id(created.id)
    assert found.alias == "Demo Account"
    
    # Get all for user
    user_accounts = repo.get_all(test_user.id)
    assert len(user_accounts) >= 1
    
    # Update
    found.alias = "Updated Demo Account"
    updated = repo.update(found)
    assert updated.alias == "Updated Demo Account"
    
    # Delete
    del_msg = repo.delete(found, found.id)
    assert "eliminada correctamente" in del_msg
    
    # Not found raises NotFoundError
    with pytest.raises(NotFoundError):
        repo.get_by_id(999999)

def test_postgres_strategy_repository(db_session, test_user):
    repo = PostgresStrategyRepository(db_session)
    
    # Create strategy with items
    strategy = Strategy(
        name="Break & Retest",
        description="Support resistance flip",
        user_id=test_user.id,
        items=[
            StrategyItem(condition="Clean S/R level", weight_percent=50.0),
            StrategyItem(condition="Bullish Engulfing candle", weight_percent=50.0)
        ]
    )
    created = repo.create(strategy)
    assert created.id is not None
    
    # Get by ID
    found = repo.get_by_id(created.id)
    assert found.name == "Break & Retest"
    assert len(found.items) == 2
    
    # Get all for user
    strategies = repo.get_all(test_user.id)
    assert len(strategies) >= 1
    
    # Update
    found.name = "Updated Break & Retest"
    updated = repo.update(found)
    assert updated.name == "Updated Break & Retest"
    
    # Delete
    repo.delete(found)
    assert repo.get_by_id(created.id) is None

def test_postgres_trade_idea_repository(db_session, test_user, test_strategy):
    repo = PostgresTradeIdeaRepository(db_session)
    
    # Create Idea
    idea = TradeIdea(
        asset="XAUUSD",
        strategy_id=test_strategy.id,
        status="DRAFT",
        user_id=test_user.id
    )
    created = repo.create(idea)
    assert created.id is not None
    
    # Create Evidence
    ev = TimeframeEvidence(
        trade_idea_id=created.id,
        timeframe="4H",
        note="Gold key level rejection",
        image_url="/uploads/ideas/gold_4h.png"
    )
    created_ev = repo.create_evidence(ev)
    assert created_ev.id is not None
    
    # Get all
    ideas = repo.get_all(user_id=test_user.id)
    assert len(ideas) >= 1
    
    # Update
    created.status = "EXECUTED"
    updated = repo.update(created)
    assert updated.status == "EXECUTED"
    
    # Delete
    repo.delete(updated)
    assert repo.get_by_id(created.id) is None

def test_postgres_trade_repository(db_session, test_account, test_user):
    repo = TradeRepositoryPostgres(db_session)
    
    # Create Trade
    trade = Trade(
        account_id=test_account.id,
        ticket=100200,
        symbol="BTCUSD",
        type="BUY",
        open_time=datetime(2026, 3, 1, 10, 0),
        close_time=datetime(2026, 3, 1, 12, 0),
        profit=850.0,
        commission=-5.0,
        swap=0.0
    )
    created = repo.create(trade)
    assert created.id is not None
    
    # Get by ID
    found = repo.get_by_id(created.id)
    assert found.ticket == 100200
    
    # Get all with dates
    trades = repo.get_all(start_date="2026-03-01", end_date="2026-03-02", user_id=test_user.id)
    assert len(trades) == 1
    
    # Update
    found.notes = "Nice breakout"
    updated = repo.update(found)
    assert updated.notes == "Nice breakout"
    
    # Emotions and Mistakes
    emotions = repo.get_emotions()
    assert len(emotions) > 0
    mistakes = repo.get_mistakes()
    assert len(mistakes) > 0

def test_mt5_sync_repository_success():
    repo = MT5SyncRepository()
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": [{"account": 12345, "status": "success"}]}
        mock_post.return_value = mock_response
        
        result = repo.fetch_trades({"accounts": []})
        assert len(result) == 1
        assert result[0]["account"] == 12345

def test_mt5_sync_repository_http_error():
    repo = MT5SyncRepository()
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_post.return_value = mock_response
        
        with pytest.raises(HTTPException) as exc_info:
            repo.fetch_trades({"accounts": []})
        assert exc_info.value.status_code == 500
        assert "Error VPS" in exc_info.value.detail
