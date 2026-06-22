"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format, startOfWeek, endOfWeek, subMonths, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";
import { Calendar, TrendingUp, TrendingDown, Clock, Filter, Edit3, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EditTradeModal from "./components/EditTradeModal";
import api from '@/app/lib/api'

interface Trade {
  id: number;
  ticket: string | number; // Lo ajustamos porque en tu Pydantic es int
  symbol: string;          // Cambiado de 'asset' a 'symbol'
  type: string;            // Cambiado de 'action' a 'type'
  profit: number;
  open_time: string;
  close_time: string | null;
  account_alias?: string;  // Lo hacemos opcional por ahora
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para los metadatos del Modal
  const [strategies, setStrategies] = useState<any[]>([]);
  const [emotions, setEmotions] = useState<any[]>([]);
  const [mistakes, setMistakes] = useState<any[]>([]);

  // Estado del Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const today = new Date();
  const defaultStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const defaultEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [activePreset, setActivePreset] = useState<string>("semana");

  const API_URL = "http://localhost:8000";

  // EFECTO 1: Cargar Metadatos UNA SOLA VEZ al abrir la página
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // Hacemos las 3 peticiones en paralelo para mayor velocidad
        const [stratRes, emotRes, mistRes] = await Promise.all([
          api.get(`${API_URL}/strategies/`),
          api.get(`${API_URL}/trades/emotions/`),
          api.get(`${API_URL}/trades/mistakes/`)
        ]);
        setStrategies(stratRes.data);
        setEmotions(emotRes.data);
        setMistakes(mistRes.data);
      } catch (error) {
        console.error("Error cargando metadatos para el modal:", error);
      }
    };
    fetchMetadata();
  }, []); // Array vacío = se ejecuta solo al montar

  // EFECTO 2: Cargar Trades cada vez que cambian las fechas
  useEffect(() => {
    fetchTrades();
  }, [startDate, endDate]);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const response = await api.get<Trade[]>(`${API_URL}/trades/`, {
        params: { start_date: startDate, end_date: endDate }
      });
      setTrades(response.data);
    } catch (error) {
      console.error("Error en la obtención de trades:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: "semana" | "mes" | "trimestre") => {
    setActivePreset(preset);
    const now = new Date();
    
    if (preset === "semana") {
      setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
      setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
    } else if (preset === "mes") {
      setStartDate(format(subMonths(now, 1), "yyyy-MM-dd"));
      setEndDate(format(now, "yyyy-MM-dd"));
    } else if (preset === "trimestre") {
      setStartDate(format(subMonths(now, 3), "yyyy-MM-dd"));
      setEndDate(format(now, "yyyy-MM-dd"));
    }
  };

  const handleDateChange = (type: "start" | "end", value: string) => {
    setActivePreset("custom");
    if (type === "start") setStartDate(value);
    else setEndDate(value);
  };

  const handleEditClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsEditModalOpen(true);
  };

  const calculateDuration = (open: string, close: string | null) => {
    if (!close) return "En curso";
    const dOpen = new Date(open);
    const dClose = new Date(close);
    const days = differenceInDays(dClose, dOpen);
    const hours = differenceInHours(dClose, dOpen) % 24;
    const minutes = differenceInMinutes(dClose, dOpen) % 60;

    let durationStr = "";
    if (days > 0) durationStr += `${days}d `;
    if (hours > 0 || days > 0) durationStr += `${hours}h `;
    durationStr += `${minutes}m`;
    return durationStr;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="text-blue-600" size={28} />
          Historial de Trades
        </h1>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(["semana", "mes", "trimestre"] as const).map((preset) => (
            <button 
              key={preset}
              onClick={() => applyPreset(preset)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activePreset === preset ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400 mr-1" />
          <Input type="date" value={startDate} onChange={(e) => handleDateChange("start", e.target.value)} className="w-36 h-9 text-sm" />
          <span className="text-slate-400">-</span>
          <Input type="date" value={endDate} onChange={(e) => handleDateChange("end", e.target.value)} className="w-36 h-9 text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="hidden md:flex items-center px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="w-1/5">Cuenta</div>
          <div className="w-1/5">Activo / Dirección</div>
          <div className="w-1/5">Apertura</div>
          <div className="w-1/5">Duración</div>
          <div className="w-1/5 text-right">Resultado Neto</div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
            <p>Ausencia de ejecuciones en el intervalo seleccionado.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {trades.map((trade) => {
              const isWin = trade.profit > 0;
              const isLoss = trade.profit < 0;
              
              return (
                <div key={trade.id} className="group flex flex-col md:flex-row items-start md:items-center px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="w-full md:w-1/5 flex items-center gap-2 mb-2 md:mb-0">
                    <Wallet size={16} className="text-slate-400" />
                    <span className="font-medium text-slate-700 text-sm">
                      {trade.account_alias || "N/A"}
                    </span>
                  </div>

                  {/* COL 2: Activo y Dirección */}
                  <div className="w-full md:w-1/5 flex items-center gap-3 mb-2 md:mb-0">
                    <div className={`p-2 rounded-lg ${trade.type === 'BUY' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
                      {trade.type === 'BUY' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{trade.symbol}</p>
                      <p className="text-xs font-bold text-slate-500">{trade.type}</p>
                    </div>
                  </div>

                  <div className="w-full md:w-1/5 mb-2 md:mb-0">
                    <div className="flex items-center text-sm text-slate-600">
                      <Clock size={14} className="mr-1.5 text-slate-400" />
                      {format(new Date(trade.open_time), "dd MMM, HH:mm")}
                    </div>
                  </div>

                  <div className="w-full md:w-1/5 mb-2 md:mb-0">
                    <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                      {calculateDuration(trade.open_time, trade.close_time)}
                    </span>
                  </div>

                  <div className="w-full md:w-1/5 flex items-center justify-between md:justify-end gap-4">
                    <div className="text-left md:text-right">
                      <p className={`font-black text-lg ${isWin ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-600'}`}>
                        {isWin ? '+' : ''}{trade.profit.toFixed(2)}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleEditClick(trade)}
                      className="opacity-100 md:opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MONTAJE ACTUALIZADO DEL MODAL */}
      {selectedTrade && (
        <EditTradeModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          trade={selectedTrade}
          onSave={fetchTrades} // <--- Reemplazado onSuccess por onSave
          strategies={strategies} // <--- Se inyecta la lista
          emotions={emotions}     // <--- Se inyecta la lista
          mistakes={mistakes}     // <--- Se inyecta la lista
        />
      )}
    </div>
  );
}