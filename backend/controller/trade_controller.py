from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from repositories.retrieve_data_trades.mt5_sync_repository import MT5SyncRepository
from core.postgres_database import get_db
from repositories.trades.trade_repository_postgres import TradeRepositoryPostgres
from repositories.account.account_repository_postgress import PostgresAccountRepository
from services.trade_service import TradeService
from schemas.trades.trade_schema import (
    TradeResponse, TradeAnalysisUpdate, DashboardStats, 
    CalendarResponse, EmotionResponse, MistakeResponse, StrategyResponse
)

router = APIRouter(tags=["Trades"])

def get_trade_service(db: Session = Depends(get_db)):
    trade_repo = TradeRepositoryPostgres(db)
    account_repo = PostgresAccountRepository(db)
    retrieve_trades_repo = MT5SyncRepository()  # Instancia del repositorio de sincronización
    return TradeService(trade_repo, account_repo, retrieve_trades_repo)

@router.post("/sync-all")
def sync_all_accounts(service: TradeService = Depends(get_trade_service)):
    return service.sync_all_accounts()

@router.get("/trades/", response_model=List[TradeResponse])
def get_trades_route(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    service: TradeService = Depends(get_trade_service)
):
    return service.get_trades(start_date, end_date)

@router.patch("/trades/{trade_id}")
def update_trade_analysis(
    trade_id: int, 
    analysis: TradeAnalysisUpdate, 
    service: TradeService = Depends(get_trade_service)
):
    return service.update_trade_analysis(trade_id, analysis)

@router.get("/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats(
    account_id: Optional[int] = None, 
    service: TradeService = Depends(get_trade_service)
):
    return service.get_dashboard_stats(account_id)

@router.get("/calendar-stats", response_model=CalendarResponse)
def get_calendar_stats(
    year: int, 
    month: int, 
    account_id: Optional[int] = None, 
    service: TradeService = Depends(get_trade_service)
):
    return service.get_calendar_stats(year, month, account_id)

@router.get("/emotions/", response_model=List[EmotionResponse])
def get_emotions(service: TradeService = Depends(get_trade_service)):
    return service.trade_repo.get_emotions()

@router.get("/mistakes/", response_model=List[MistakeResponse])
def get_mistakes(service: TradeService = Depends(get_trade_service)):
    return service.trade_repo.get_mistakes()
