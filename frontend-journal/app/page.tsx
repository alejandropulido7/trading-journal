"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { format } from "date-fns";
import { 
  TrendingUp, TrendingDown, Wallet, Activity, ArrowRight, 
  BarChart3, CalendarDays, CreditCard, ArrowUpCircle, 
  ArrowDownCircle, Loader2, Filter, Calendar1Icon, ChartCandlestick
} from "lucide-react";

// Importamos el calendario actualizado
import TradingCalendar from "./components/TradingCalendar";
import BalanceChart from "./components/BalanceChart";
import AdvancedStats from "./components/AdvancedStats";
import RiskStatusCard from "./components/RiskStatusCard";

// Interfaces
interface DashboardData {
  total_balance: number;
  total_pl: number;
  active_accounts: number;
  win_rate: number;
  recent_trades: {
    id: number;
    symbol: string;
    type: string;
    profit: number;
    close_time: string;
    account_alias: string;
  }[];
  balance_curve: { date: string, balance: number }[];
  best_trade: number;
  worst_trade: number;
  average_win: number;
  average_loss: number;
  highest_profitable_day: number;
  total_trades_count: number;
  profit_factor: number;
  average_rrr: number;
  sharpe_ratio: number;
  z_score: number;
  risk_metrics: any[];
}

interface AccountSimple {
  id: number;
  alias: string;
  login_id: number;
  active: boolean;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [accounts, setAccounts] = useState<AccountSimple[]>([]); // Lista para el dropdown
  const [selectedAccount, setSelectedAccount] = useState<number | "">(""); // ESTADO GLOBAL
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:8000';

  // 1. Cargar la lista de cuentas (solo una vez)
  useEffect(() => {
    axios.get(`${API_URL}/accounts/`)
    .then(res => {
      const response:AccountSimple[] = res.data;
      return response.filter(dataFilter => dataFilter.active != false);
    })
    .then(res => setAccounts(res));
  }, []);

  // 2. Cargar Stats cuando cambia la cuenta seleccionada
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true); // Opcional: mostrar loading en las cards
      try {
        let url = `${API_URL}/dashboard-stats`;
        if (selectedAccount) {
            url += `?account_id=${selectedAccount}`;
        }
        
        const res = await axios.get<DashboardData>(url);
        setStats(res.data);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedAccount]); // <--- Dependencia clave

  // Valores seguros para evitar crash
  const data = stats || {
    total_balance: 0,
    total_pl: 0,
    active_accounts: 0,
    win_rate: 0,
    recent_trades: [],
    balance_curve: [],
    risk_metrics: []
  };

  const isPositive = data.total_pl >= 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* 1. HEADER CON DROPDOWN GLOBAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard General</h1>
          <p className="text-slate-500">Resumen en tiempo real de tu operativa.</p>
        </div>
        
        <div className="flex items-center gap-3">
            {/* DROPDOWN GLOBAL */}
            <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <select 
                    className="pl-9 pr-8 py-2 border border-slate-200 rounded-full text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer font-medium text-slate-700 min-w-[200px]"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value === "" ? "" : Number(e.target.value))}
                >
                    <option value="">Todas las Cuentas</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                            {acc.alias} ({acc.login_id})
                        </option>
                    ))}
                </select>
            </div>

            <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm font-medium hidden md:block">
               {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
        </div>
      </div>

      {/* 2. TARJETAS KPI (Se actualizan solas con 'data') */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Capital */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Wallet className="text-blue-600 w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Capital</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {loading ? "..." : `$${data.total_balance.toLocaleString()}`}
          </p>
          <p className="text-xs text-slate-500 mt-1">
             {selectedAccount ? "En cuenta seleccionada" : "En cuentas activas"}
          </p>
        </div>

        {/* Global P&L */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           {/* ... Igual que antes ... */}
           <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {isPositive ? <TrendingUp className="text-emerald-600 w-6 h-6" /> : <TrendingDown className="text-red-600 w-6 h-6" />}
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net P&L</span>
          </div>
          <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {loading ? "..." : `${isPositive ? '+' : ''}$${data.total_pl.toLocaleString()}`}
          </p>
          <p className="text-xs text-slate-500 mt-1">Rendimiento</p>
        </div>

        {/* ... (Las otras tarjetas de Cuentas y WinRate siguen igual) ... */}
        {/* Cuentas Activas */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <CreditCard className="text-purple-600 w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cuentas</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
             {loading ? "..." : data.active_accounts}
          </p>
          <p className="text-xs text-slate-500 mt-1">Monitoreadas</p>
        </div>

        {/* Win Rate */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Activity className="text-orange-600 w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Win Rate</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {loading ? "..." : `${data.win_rate}%`}
          </p>
          <p className="text-xs text-slate-500 mt-1">Histórico</p>
        </div>

      </div>

      {/* 3. GRÁFICO Y TRADES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRÁFICO */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Curva de Equidad
                </h3>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
                    {selectedAccount ? "Cuenta Individual" : "Global"}
                </span>
            </div>
            
            {/* Usamos el componente BalanceChart */}
            <div className="h-80 w-full"> {/* Contenedor con altura definida */}
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-500" />
                    </div>
                ) : (
                    <BalanceChart data={data.balance_curve} />
                )}
            </div>
        </div>

        {/* ÚLTIMOS TRADES */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Actividad Reciente
          </h3>
          <div className="flex-1 space-y-3">
             {/* ... Renderizado de trades igual que antes ... */}
             {data.recent_trades.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No hay operaciones.</p>
            ) : (
                data.recent_trades.map((trade) => (
                <div key={trade.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${trade.type === 'BUY' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                        {trade.type === 'BUY' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700">{trade.symbol}</p>
                        <p className="text-xs text-slate-400">{trade.account_alias}</p>
                    </div>
                    </div>
                    <div className="text-right">
                    <p className={`text-sm font-bold ${trade.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {trade.profit >= 0 ? '+' : ''}{trade.profit.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}
                    </p>
                    </div>
                </div>
                ))
            )}
          </div>
          <Link href="/trades" className="mt-4 text-center text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 py-2 hover:bg-blue-50 rounded-lg transition">
            Ver Historial Completo <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      <div>
        <div className="mt-8">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              🛡️ Gestión de Riesgo & Reglas
          </h3>
          
          {data.risk_metrics && data.risk_metrics.length > 0 ? (
              data.risk_metrics.map((metric: any, idx: number) => (
                  <RiskStatusCard key={idx} metric={metric} />
              ))
          ) : (
              <p className="text-slate-400 text-sm">No hay datos de riesgo disponibles.</p>
          )}
        </div>
      </div>
      <div>
        <div className="mt-8">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ChartCandlestick size={20}/>
              Estadísticas Avanzadas
          </h3>
          {/* Usamos un contenedor oscuro para que resalten las tarjetas como en la imagen */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl">
              <AdvancedStats data={stats} />
          </div>
        </div>
      </div>

      {/* --- 4. CALENDARIO CONECTADO AL ESTADO GLOBAL --- */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar1Icon size={20} />
            Calendario de Rendimiento
        </h3>
        {/* Aquí pasamos el ID seleccionado */}
        <TradingCalendar selectedAccountId={selectedAccount} />
      </div>

    </div>
  );
}