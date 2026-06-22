export interface StrategyItem {
  id: number;
  condition: string;
  weight_percent: number;
}

export interface Strategy {
  id: number;
  name: string;
  description: string | null;
  items: StrategyItem[];
}