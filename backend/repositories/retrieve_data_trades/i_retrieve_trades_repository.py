from abc import ABC, abstractmethod
from typing import List, Dict, Any

class IMT5SyncRepository(ABC):
    
    @abstractmethod
    def fetch_trades(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Consulta la API externa de la VPS para obtener trades y balance.
        """
        pass
