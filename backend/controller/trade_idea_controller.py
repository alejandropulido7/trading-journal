from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from typing import List, Optional
from sqlalchemy.orm import Session
from models.user.user_model import User
from core.postgres_database import get_db
from services.trade_idea_service import TradeIdeaService
from repositories.trade_ideas.trade_idea_repository_postgres import PostgresTradeIdeaRepository
from schemas.trade_ideas.trade_idea_schema import (
    TradeIdeaCreate, TradeIdeaResponse, StatusUpdate, TimeframeEvidenceResponse
)
from core.dependencies_auth import get_current_user

router = APIRouter(tags=["Trade Ideas"], dependencies=[Depends(get_current_user)])

def get_trade_idea_service(db: Session = Depends(get_db), 
                           current_user: User = Depends(get_current_user)):
    repo = PostgresTradeIdeaRepository(db)
    return TradeIdeaService(repo, current_user)

@router.get("/trade-ideas/", response_model=List[TradeIdeaResponse])
def get_trade_ideas(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, le=100),
    service: TradeIdeaService = Depends(get_trade_idea_service)
):
    return service.get_trade_ideas(start_date, end_date, skip, limit)

@router.patch("/trade-ideas/{idea_id}/status")
def update_idea_status(
    idea_id: int, 
    status_update: StatusUpdate, 
    service: TradeIdeaService = Depends(get_trade_idea_service)
):
    return service.update_idea_status(idea_id, status_update)

@router.delete("/trade-ideas/{idea_id}")
def delete_trade_idea(
    idea_id: int, 
    service: TradeIdeaService = Depends(get_trade_idea_service)
):
    return service.delete_trade_idea(idea_id)

@router.post("/trade-ideas/", response_model=TradeIdeaResponse)
def create_trade_idea(
    idea_data: TradeIdeaCreate, 
    service: TradeIdeaService = Depends(get_trade_idea_service)
):
    return service.create_trade_idea(idea_data)

@router.post("/trade-ideas/{idea_id}/evidences/", response_model=TimeframeEvidenceResponse)
async def upload_idea_evidence(
    idea_id: int, 
    timeframe: str = Form(...), 
    note: str = Form(""), 
    file: UploadFile = File(...), 
    service: TradeIdeaService = Depends(get_trade_idea_service)
):
    return await service.upload_idea_evidence(idea_id, timeframe, note, file)
