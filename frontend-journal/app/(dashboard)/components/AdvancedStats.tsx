import { Info } from "lucide-react";

interface AdvancedStatsProps {
  data: {
    best_trade?: number;
    worst_trade?: number;
    average_win?: number;
    average_loss?: number;
    highest_profitable_day?: number;
    total_trades_count?: number;
    profit_factor?: number;
    average_rrr?: number;
    sharpe_ratio?: number;
    z_score?: number;
  } | null;
}

export default function AdvancedStats({ data }: AdvancedStatsProps) {
  // --- CORRECCIÓN AQUÍ ---
  // Usamos data?.propiedad ?? 0
  // Esto significa: "Si data existe y tiene la propiedad, úsala. Si no, usa 0".
  const stats = {
    best_trade: data?.best_trade ?? 0,
    worst_trade: data?.worst_trade ?? 0,
    average_win: data?.average_win ?? 0,
    average_loss: data?.average_loss ?? 0,
    highest_profitable_day: data?.highest_profitable_day ?? 0,
    total_trades_count: data?.total_trades_count ?? 0,
    profit_factor: data?.profit_factor ?? 0,
    average_rrr: data?.average_rrr ?? 0,
    sharpe_ratio: data?.sharpe_ratio ?? 0,
    z_score: data?.z_score ?? 0
  };

  // Helper para renderizar tarjetas
  const StatCard = ({ title, value, type = "neutral", info = "" }: any) => {
    let valueColor = "text-slate-200";
    if (type === "money-win") valueColor = "text-emerald-600";
    if (type === "money-loss") valueColor = "text-red-600";
    if (type === "number-good") valueColor = "text-emerald-600";
    if (type === "number-bad") valueColor = "text-red-600";
    if (type === "neutral-bright") valueColor = "text-black";

    return (
      <div className="bg-slate-100 p-5 rounded-xl border border-slate-300 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-slate-400">{title}</span>
            {info && <Info size={12} className="text-slate-600" />}
        </div>
        <span className={`text-2xl font-bold tracking-tight ${valueColor}`}>
          {value}
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* COLUMNA 1 */}
      <StatCard 
        title="Best Trade" 
        value={`$${stats.best_trade.toLocaleString()}`} 
        type="money-win" 
      />
      <StatCard 
        title="Worst Trade" 
        value={`$${stats.worst_trade.toLocaleString()}`} 
        type="money-loss" 
      />
      
      {/* COLUMNA 2 */}
      <StatCard 
        title="Average Win" 
        value={`$${stats.average_win.toLocaleString()}`} 
        type="money-win" 
      />
      <StatCard 
        title="Average Loss" 
        value={`$${stats.average_loss.toLocaleString()}`} 
        type="money-loss" 
      />

      {/* COLUMNA 3 */}
      <StatCard 
        title="Highest Profitable Day" 
        value={`$${stats.highest_profitable_day.toLocaleString()}`} 
        type="money-win" 
      />
       <StatCard 
        title="Total Trades" 
        value={stats.total_trades_count} 
        type="neutral-bright" 
      />

      {/* FILA INFERIOR: RATIOS */}
      {/* <div className="hidden lg:block"></div> Espaciador opcional */}
      
      <StatCard 
        title="Average RRR" 
        value={stats.average_rrr} 
        type="neutral-bright" 
      />
      <StatCard 
        title="Profit Factor" 
        value={stats.profit_factor} 
        type={stats.profit_factor >= 1 ? "number-good" : "number-bad"} 
        info="Gross Profit / Gross Loss"
      />
      <StatCard 
        title="Z-Score" 
        value={stats.z_score} 
        type={stats.z_score >= 0 ? "number-good" : "number-bad"} 
        info="Probabilidad de racha"
      />
      <StatCard 
        title="Sharpe Ratio" 
        value={stats.sharpe_ratio} 
        type={stats.sharpe_ratio > 1 ? "number-good" : "number-bad"} 
        info="Retorno ajustado al riesgo"
      />
    </div>
  );
}