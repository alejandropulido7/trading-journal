import pytest
import io
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi import HTTPException, UploadFile
from services.trade_idea_service import TradeIdeaService
from schemas.trade_ideas.trade_idea_schema import TradeIdeaCreate, TradeIdeaItemBase, StatusUpdate
from models.trade_ideas.trade_idea_models import TradeIdea, TradeIdeaItem, TimeframeEvidence
from models.user.user_model import User

def test_trade_idea_service_get_trade_ideas():
    mock_repo = MagicMock()
    mock_user = User(id=1, name="Trader", email="trader@test.com")
    mock_repo.get_all.return_value = [TradeIdea(id=1, asset="EURUSD", user_id=1)]
    
    service = TradeIdeaService(mock_repo, mock_user)
    result = service.get_trade_ideas(start_date="2026-01-01", end_date="2026-01-31", skip=0, limit=10)
    
    assert len(result) == 1
    assert result[0].asset == "EURUSD"
    mock_repo.get_all.assert_called_once_with("2026-01-01", "2026-01-31", 0, 10, 1)

def test_trade_idea_service_create_trade_idea():
    mock_repo = MagicMock()
    mock_user = User(id=7, name="Trader", email="trader@test.com")
    service = TradeIdeaService(mock_repo, mock_user)
    
    idea_data = TradeIdeaCreate(
        asset="GBPUSD",
        strategy_id=3,
        checklist=[
            TradeIdeaItemBase(strategy_item_id=1, is_active=True, direction="BUY"),
            TradeIdeaItemBase(strategy_item_id=2, is_active=False, direction=None)
        ]
    )
    
    def fake_create(idea):
        idea.id = 15
        return idea
        
    mock_repo.create.side_effect = fake_create
    
    created = service.create_trade_idea(idea_data)
    assert created.id == 15
    assert created.asset == "GBPUSD"
    assert created.strategy_id == 3
    assert created.status == "DRAFT"
    assert created.user_id == 7
    assert len(created.checklist) == 2
    assert created.checklist[0].strategy_item_id == 1
    assert created.checklist[0].is_active is True
    assert created.checklist[0].direction == "BUY"
    assert created.checklist[1].strategy_item_id == 2
    assert created.checklist[1].is_active is False
    assert created.checklist[1].direction is None
    mock_repo.create.assert_called_once()

def test_trade_idea_service_update_status_success():
    mock_repo = MagicMock()
    mock_user = User(id=1, name="Trader", email="trader@test.com")
    existing_idea = TradeIdea(id=10, asset="NAS100", status="DRAFT", user_id=1)
    mock_repo.get_by_id.return_value = existing_idea
    mock_repo.update.side_effect = lambda idea: idea
    
    service = TradeIdeaService(mock_repo, mock_user)
    updated = service.update_idea_status(10, StatusUpdate(status="EXECUTED"))
    
    assert updated.status == "EXECUTED"
    mock_repo.update.assert_called_once_with(existing_idea)

def test_trade_idea_service_update_status_not_found():
    mock_repo = MagicMock()
    mock_user = User(id=1, name="Trader", email="trader@test.com")
    mock_repo.get_by_id.return_value = None
    
    service = TradeIdeaService(mock_repo, mock_user)
    with pytest.raises(HTTPException) as exc_info:
        service.update_idea_status(999, StatusUpdate(status="EXECUTED"))
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Idea no encontrada"

def test_trade_idea_service_delete_trade_idea_success():
    mock_repo = MagicMock()
    mock_user = User(id=1, name="Trader", email="trader@test.com")
    existing_idea = TradeIdea(id=10, asset="NAS100", status="DRAFT", user_id=1)
    mock_repo.get_by_id.return_value = existing_idea
    
    service = TradeIdeaService(mock_repo, mock_user)
    result = service.delete_trade_idea(10)
    assert result == {"message": "Idea eliminada"}
    mock_repo.delete.assert_called_once_with(existing_idea)

def test_trade_idea_service_delete_trade_idea_not_found():
    mock_repo = MagicMock()
    mock_user = User(id=1, name="Trader", email="trader@test.com")
    mock_repo.get_by_id.return_value = None
    
    service = TradeIdeaService(mock_repo, mock_user)
    with pytest.raises(HTTPException) as exc_info:
        service.delete_trade_idea(999)
    assert exc_info.value.status_code == 404

@pytest.mark.asyncio
async def test_trade_idea_service_upload_idea_evidence_success():
    mock_repo = MagicMock()
    mock_user = User(id=1, name="Trader", email="trader@test.com")
    existing_idea = TradeIdea(id=5, asset="US30", user_id=1)
    mock_repo.get_by_id.return_value = existing_idea
    
    def fake_create_evidence(ev):
        ev.id = 100
        return ev
    mock_repo.create_evidence.side_effect = fake_create_evidence
    
    service = TradeIdeaService(mock_repo, mock_user)
    
    fake_file_content = b"fake image content png bytes"
    fake_file = UploadFile(filename="analysis_15m.png", file=io.BytesIO(fake_file_content))
    
    with patch("shutil.copyfileobj"):
        with patch("builtins.open", MagicMock()):
            result = await service.upload_idea_evidence(
                idea_id=5,
                timeframe="15M",
                note="Clean order block rejection",
                file=fake_file
            )
            assert result.id == 100
            assert result.trade_idea_id == 5
            assert result.timeframe == "15M"
            assert result.note == "Clean order block rejection"
            assert "/uploads/ideas/idea_5_15M_" in result.image_url
            assert result.image_url.endswith(".png")
            mock_repo.create_evidence.assert_called_once()

@pytest.mark.asyncio
async def test_trade_idea_service_upload_idea_evidence_not_found():
    mock_repo = MagicMock()
    mock_user = User(id=1, name="Trader", email="trader@test.com")
    mock_repo.get_by_id.return_value = None
    
    service = TradeIdeaService(mock_repo, mock_user)
    fake_file = UploadFile(filename="analysis.png", file=io.BytesIO(b"data"))
    
    with pytest.raises(HTTPException) as exc_info:
        await service.upload_idea_evidence(idea_id=999, timeframe="1H", note="", file=fake_file)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Trade Idea no encontrada"
