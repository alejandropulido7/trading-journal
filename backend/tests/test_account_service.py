import pytest
from unittest.mock import MagicMock
from services.account_service import AccountService
from schemas.account.account_schema import AccountCreate, AccountUpdate
from models.account.account_model import Account
from core.security import security

def test_account_service_get_accounts():
    mock_repo = MagicMock()
    mock_repo.get_all.return_value = [
        Account(id=1, alias="Account 1", user_id=10),
        Account(id=2, alias="Account 2", user_id=10)
    ]
    service = AccountService(mock_repo)
    
    result = service.get_accounts(user_id=10)
    assert len(result) == 2
    assert result[0].alias == "Account 1"
    mock_repo.get_all.assert_called_once_with(10)

def test_account_service_create_account():
    mock_repo = MagicMock()
    service = AccountService(mock_repo)
    
    account_data = AccountCreate(
        login_id=987654321,
        password="plain_password_123",
        server="ICMarkets-Live",
        alias="ICMarkets Scalping",
        prop_firm="Personal",
        account_type="Funded",
        initial_balance=5000.0,
        risk_per_trade=1.5,
        target_percent=10.0,
        investment=5000.0,
        trailing_drawdown=False,
        daily_drawdown_limit=5.0,
        max_drawdown_limit=10.0,
        consistency_rule=0.0,
        start_date="2026-01-01"
    )
    
    def fake_create(acc):
        acc.id = 99
        return acc
        
    mock_repo.create.side_effect = fake_create
    
    created = service.create_account(account_data, user_id=5)
    
    assert created.id == 99
    assert created.user_id == 5
    assert created.balance == 5000.0
    assert created.active is True
    # Verify password was encrypted
    assert created.password != "plain_password_123"
    assert security.decrypt(created.password) == "plain_password_123"
    mock_repo.create.assert_called_once()

def test_account_service_update_account_status_reactive():
    mock_repo = MagicMock()
    existing_account = Account(
        id=1,
        alias="Prop 1",
        active=False,
        loss_reason="Max Drawdown reached",
        outcome="Lost"
    )
    mock_repo.get_by_id.return_value = existing_account
    mock_repo.update.side_effect = lambda acc: acc
    
    service = AccountService(mock_repo)
    
    # Reactivating account should reset loss_reason and outcome to None
    update_data = AccountUpdate(active=True)
    updated = service.update_account_status(1, update_data)
    
    assert updated.active is True
    assert updated.loss_reason is None
    assert updated.outcome is None
    mock_repo.update.assert_called_once_with(existing_account)

def test_account_service_update_account_loss_reason_and_outcome():
    mock_repo = MagicMock()
    existing_account = Account(
        id=1,
        alias="Prop 1",
        active=True,
        loss_reason=None,
        outcome=None
    )
    mock_repo.get_by_id.return_value = existing_account
    mock_repo.update.side_effect = lambda acc: acc
    
    service = AccountService(mock_repo)
    
    update_data = AccountUpdate(
        active=False,
        loss_reason="Daily limit exceeded",
        outcome="Failed Phase 1"
    )
    updated = service.update_account_status(1, update_data)
    
    assert updated.active is False
    assert updated.loss_reason == "Daily limit exceeded"
    assert updated.outcome == "Failed Phase 1"

def test_account_service_delete_account():
    mock_repo = MagicMock()
    existing_account = Account(id=1, alias="Account to delete")
    mock_repo.get_by_id.return_value = existing_account
    mock_repo.delete.return_value = "message: Cuenta Account to delete eliminada correctamente"
    
    service = AccountService(mock_repo)
    result = service.delete_account(1)
    
    assert "Cuenta Account to delete eliminada" in result
    mock_repo.get_by_id.assert_called_once_with(1)
    mock_repo.delete.assert_called_once_with(existing_account, 1)
