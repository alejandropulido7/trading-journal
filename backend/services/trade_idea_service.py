import os
import uuid
import shutil
from typing import List, Optional
from fastapi import HTTPException, UploadFile
from models_core import TradeIdea, TradeIdeaItem, TimeframeEvidence
from schemas.trade_ideas.trade_idea_schema import TradeIdeaCreate, StatusUpdate
from repositories.trade_ideas.i_trade_idea_repository import ITradeIdeaRepository

class TradeIdeaService:
    def __init__(self, repo: ITradeIdeaRepository):
        self.repo = repo
        self.upload_dir = "uploads/ideas"
        os.makedirs(self.upload_dir, exist_ok=True)

    def get_trade_ideas(self, start_date: Optional[str] = None, end_date: Optional[str] = None, skip: int = 0, limit: int = 10):
        return self.repo.get_all(start_date, end_date, skip, limit)

    def update_idea_status(self, idea_id: int, status_update: StatusUpdate):
        idea = self.repo.get_by_id(idea_id)
        if not idea:
            raise HTTPException(status_code=404, detail="Idea no encontrada")
        idea.status = status_update.status
        return self.repo.update(idea)

    def delete_trade_idea(self, idea_id: int):
        idea = self.repo.get_by_id(idea_id)
        if not idea:
            raise HTTPException(status_code=404, detail="Idea no encontrada")
        self.repo.delete(idea)
        return {"message": "Idea eliminada"}

    def create_trade_idea(self, idea_data: TradeIdeaCreate):
        db_idea = TradeIdea(
            asset=idea_data.asset,
            strategy_id=idea_data.strategy_id,
            status="DRAFT"
        )
        
        # Agregamos los items del checklist directamente al objeto (SQLAlchemy handle relationships)
        for item in idea_data.checklist:
            db_item = TradeIdeaItem(
                strategy_item_id=item.strategy_item_id,
                is_active=item.is_active,
                direction=item.direction if item.is_active else None
            )
            db_idea.checklist.append(db_item)
            
        return self.repo.create(db_idea)

    async def upload_idea_evidence(self, idea_id: int, timeframe: str, note: str, file: UploadFile):
        idea = self.repo.get_by_id(idea_id)
        if not idea:
            raise HTTPException(status_code=404, detail="Trade Idea no encontrada")

        file_ext = file.filename.split(".")[-1]
        safe_filename = f"idea_{idea_id}_{timeframe}_{uuid.uuid4().hex[:6]}.{file_ext}"
        file_path = os.path.join(self.upload_dir, safe_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        new_evidence = TimeframeEvidence(
            trade_idea_id=idea_id,
            timeframe=timeframe,
            note=note,
            image_url=f"/uploads/ideas/{safe_filename}"
        )
        
        return self.repo.create_evidence(new_evidence)
