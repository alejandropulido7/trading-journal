import pytest
from datetime import datetime
from models.account.account_model import Account
from models.trades.trade_models import Trade, Emotion, Mistake
from models.strategies.strategy_models import Strategy, StrategyItem
from models.trade_ideas.trade_idea_models import TradeIdea, TradeIdeaItem, TimeframeEvidence
from models.server.server_model import Server
from models.user.user_model import User

def test_account_model_total_pl_and_current_percent_positive():
    account = Account(
        initial_balance=10000.0,
        balance=11500.0
    )
    assert account.total_pl == 1500.0
    assert account.current_percent == 15.0

def test_account_model_total_pl_and_current_percent_negative():
    account = Account(
        initial_balance=50000.0,
        balance=48000.0
    )
    assert account.total_pl == -2000.0
    assert account.current_percent == -4.0

def test_account_model_current_percent_zero_initial_balance():
    account = Account(
        initial_balance=0.0,
        balance=100.0
    )
    assert account.total_pl == 100.0
    assert account.current_percent == 0.0

def test_trade_account_alias_property():
    account = Account(alias="My funded account")
    trade = Trade(
        account=account,
        ticket=123456,
        symbol="EURUSD",
        type="BUY",
        close_time=datetime.now(),
        profit=250.0,
        commission=-5.0,
        swap=0.0
    )
    assert trade.account_alias == "My funded account"

def test_trade_account_alias_when_no_account():
    trade = Trade(
        ticket=123456,
        symbol="EURUSD",
        type="BUY",
        close_time=datetime.now(),
        profit=250.0,
        commission=-5.0,
        swap=0.0
    )
    assert trade.account_alias == "Desconocida"

def test_server_model_defaults():
    server = Server(name="FTMO-Demo", alias="FTMO Demo")
    assert server.name == "FTMO-Demo"
    assert server.alias == "FTMO Demo"
