// app/components/RiskStatusCard.tsx
import { AlertTriangle, ShieldCheck, Lock } from "lucide-react";

interface RiskMetric {
  account_alias: string;
  current_balance: number;
  drawdown_limit_price: number;
  drawdown_progress: number;
  is_trailing: boolean;
  max_drawdown_percent: number;
  consistency_rule_percent: number;
  consistency_progress: number;
  highest_daily_profit: number;
  profit_target_for_consistency: number;
  is_in_drawdown: boolean;
}

export default function RiskStatusCard({ metric }: { metric: RiskMetric }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <Lock size={16} className="text-slate-400" />
            {metric.account_alias}
        </h4>
        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
            Bal: ${metric.current_balance.toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* BARRA DE DRAWDOWN (ROJA) */}
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-slate-600 flex items-center gap-1">
                    <AlertTriangle size={12} className="text-rose-500" /> 
                    Drawdown {metric.is_trailing ? "(Trailing)" : "(Static)"}
                </span>
                <span className="text-rose-600 font-bold">{metric.drawdown_progress.toFixed(1)}% Usado</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                    className="bg-rose-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${metric.drawdown_progress}%` }}
                ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Hard Stop: ${metric.drawdown_limit_price.toLocaleString()}</span>
                <span>Max: {metric.max_drawdown_percent}%</span>
            </div>
        </div>

        {/* BARRA DE CONSISTENCIA (VERDE) */}
        {metric.consistency_rule_percent > 0 ? (
            <div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-600 flex items-center gap-1">
                        <ShieldCheck size={12} className="text-emerald-500" /> 
                        Regla Consistencia ({metric.consistency_rule_percent}%)
                    </span>
                    <span className="text-emerald-600 font-bold">
                        {metric.is_in_drawdown ? "En Drawdown" : `${metric.consistency_progress.toFixed(1)}%`}
                    </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                        className={`h-2.5 rounded-full transition-all duration-500 ${metric.is_in_drawdown ? 'bg-slate-300' : 'bg-emerald-500'}`}
                        style={{ width: `${metric.is_in_drawdown ? 0 : metric.consistency_progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Mejor Día: ${metric.highest_daily_profit.toLocaleString()}</span>
                    <span>Objetivo: ${metric.profit_target_for_consistency.toLocaleString()}</span>
                </div>
            </div>
        ) : (
             <div className="flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                Sin regla de consistencia activa
             </div>
        )}

      </div>
    </div>
  );
}