export interface TradeIdeaItem {
  id: number;
  strategy_item_id: number;
  is_active: boolean;
  direction: string | null;
}

export interface TradeIdea {
  id: number;
  asset: string;
  created_at: string;
  status: "DRAFT" | "EXECUTED" | "DISCARDED";
  strategy_id: number;
  checklist: TradeIdeaItem[];
  evidences: any[];
}