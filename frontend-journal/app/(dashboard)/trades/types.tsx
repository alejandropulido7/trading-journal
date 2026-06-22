export interface Trade {
  id: number;
  ticket: number;
  account_alias: string; // Viene del backend
  symbol: string;
  type: string;
  profit: number;
  open_time: string;
  close_time: string;
  commission: number;
  swap: number;
  comment?: string;
  emotion_id?: number;
  mistake_id?: number;
  strategy_id?: number;

  emotion?: { id: number; name: string };
  mistake?: { id: number; name: string };
  strategy?: { id: number; name: string };
}