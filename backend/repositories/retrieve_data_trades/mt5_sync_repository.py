import os
import requests
from typing import List, Dict, Any
from fastapi import HTTPException
from repositories.retrieve_data_trades.i_retrieve_trades_repository import IMT5SyncRepository

class MT5SyncRepository(IMT5SyncRepository):
    def __init__(self):
        self.vps_url = os.getenv("VPS_MT5_URL")
        self.vps_key = os.getenv("VPS_API_KEY")

    def fetch_trades(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        try:
            response = requests.post(
                self.vps_url, 
                json=payload, 
                headers={"X-API-KEY": self.vps_key}, 
                timeout=120
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Error VPS: {response.text}"
                )
                
            vps_response = response.json()
            return vps_response.get("data", [])

        except requests.exceptions.RequestException as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Error de conexión con VPS: {str(e)}"
            )
