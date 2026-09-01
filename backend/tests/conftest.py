import os
from cryptography.fernet import Fernet

# Set test environment variables BEFORE any application modules are imported
TEST_SECURITY_KEY = Fernet.generate_key().decode()
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECURITY_KEY_ACCOUNTS"] = TEST_SECURITY_KEY
os.environ["SECRET_KEY_USER"] = "test_super_secret_jwt_key_1234567890"
os.environ["VPS_MT5_URL"] = "http://test-vps-api:5000/api/sync-trades"
os.environ["VPS_API_KEY"] = "test_api_key_value"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

import core.postgres_database as postgres_database
from core.postgres_database import Base, get_db
import models
from models.user.user_model import User
from models.account.account_model import Account
from models.strategies.strategy_models import Strategy, StrategyItem
from models.trades.trade_models import Trade, Emotion, Mistake
from models.trade_ideas.trade_idea_models import TradeIdea, TradeIdeaItem, TimeframeEvidence
from models.server.server_model import Server
from core.dependencies_auth import get_current_user
from core.security_users import get_password_hash

# Create an in-memory SQLite engine with StaticPool for tests
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

postgres_database.engine = test_engine
postgres_database.SessionLocal = TestingSessionLocal

from main import app, seed_initial_data

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session():
    """Provides a fresh database session per test with clean tables."""
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    seed_initial_data(session)
    try:
        yield session
    finally:
        session.rollback()
        session.close()

@pytest.fixture
def test_user(db_session):
    """Creates and returns a test user."""
    user = User(
        name="Trader Joe",
        email="trader@example.com",
        hashed_password=get_password_hash("securepassword123"),
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_account(db_session, test_user):
    """Creates and returns a test account linked to test_user."""
    account = Account(
        login_id=12345678,
        password="encrypted_password_test",
        server="Demo-Server",
        alias="Personal Prop 100k",
        prop_firm="FTMO",
        account_type="Funded",
        initial_balance=100000.0,
        balance=105000.0,
        risk_per_trade=1.0,
        target_percent=10.0,
        investment=500.0,
        trailing_drawdown=False,
        daily_drawdown_limit=5.0,
        max_drawdown_limit=10.0,
        consistency_rule=30.0,
        start_date="2026-01-01",
        active=True,
        user_id=test_user.id
    )
    db_session.add(account)
    db_session.commit()
    db_session.refresh(account)
    return account

@pytest.fixture
def test_strategy(db_session, test_user):
    """Creates and returns a test strategy with items."""
    strategy = Strategy(
        name="SMC Liquidity Sweep",
        description="Sweep + FVG entry",
        user_id=test_user.id,
        items=[
            StrategyItem(condition="Liquidity Sweep at Key Level", weight_percent=40.0),
            StrategyItem(condition="Fair Value Gap confirmation", weight_percent=30.0),
            StrategyItem(condition="Market Structure Shift on 5M", weight_percent=30.0)
        ]
    )
    db_session.add(strategy)
    db_session.commit()
    db_session.refresh(strategy)
    return strategy

@pytest.fixture
def test_client(db_session, test_user):
    """FastAPI TestClient with overridden DB and Auth dependencies."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()
