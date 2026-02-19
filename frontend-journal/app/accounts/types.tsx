export interface Account {
    id: number;
    prop_firm: string;
    alias: string;
    login_id: number;
    account_type: string;
    active: boolean;
    server: string;
    
    // Financieros
    initial_balance: number;
    balance: number;
    risk_per_trade: number;
    target_percent: number;
    investment: number;
    
    // Estos pueden venir del backend o ser calculados
    total_pl?: number;
    current_percent?: number;
}

export interface AccountCreate {
    login_id: string;
    password: string;
    server: string;
    alias: string;
    prop_firm: string;
    account_type: string;
    initial_balance: string;
    risk_per_trade: string;
    target_percent: string;
    investment: string;
    trailing_drawdown: boolean;
    daily_drawdown_limit: string; // string para inputs, luego parsear a float
    max_drawdown_limit: string;
    consistency_rule: string;
}

export interface Server {
    name: string;
    alias: string;
}