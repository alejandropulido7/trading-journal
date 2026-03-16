"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Trade } from "./types";  
import TradeCard from "./TradeCard";
import EditTradeModal from "./EditTradeModal"; // <-- Importamos el modal

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dateFilter, setDateFilter] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  // --- NUEVOS ESTADOS PARA EDICIÓN ---
  const [strategies, setStrategies] = useState([]);
  const [emotions, setEmotions] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const API_URL = "http://localhost:8000";

  // Buscar options (ejecutar una vez)
  useEffect(() => {
    axios.get(`${API_URL}/strategies/`).then(res => setStrategies(res.data)).catch(console.error);
    axios.get(`${API_URL}/emotions/`).then(res => setEmotions(res.data)).catch(console.error);
    axios.get(`${API_URL}/mistakes/`).then(res => setMistakes(res.data)).catch(console.error);
  }, []);

  const fetchTrades = async (date: string) => {
    setLoading(true);
    try {
      const res = await axios.get<Trade[]>(`${API_URL}/trades/?trade_date=${date}`);
      setTrades(res.data);
    } catch (error) {
      console.error("Error cargando trades", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrades(dateFilter);
  }, [dateFilter]);

  // --- LÓGICA DE EDICIÓN ---
  const handleOpenEdit = (trade: Trade) => {
    setEditingTrade(trade);
    setIsEditModalOpen(true);
  };

  const handleSaveAnalysis = async (tradeId: number, data: any) => {
    try {
      // 1. Guardar en Backend
      await axios.patch(`${API_URL}/trades/${tradeId}`, data);
      
      // 2. Recargar trades para que devuelva los nombres (relations) actualizados
      await fetchTrades(dateFilter);
      
      setIsEditModalOpen(false);
      setEditingTrade(null);
    } catch (error) {
      console.error("Error guardando análisis:", error);
      alert("Hubo un error al guardar los datos.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trades del Día</h1>
          <p className="text-slate-500">Revisión detallada operativa</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border">
          <span className="text-sm font-medium text-slate-600 pl-2">Fecha:</span>
          <Input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-40 border-none shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">Cargando trades...</div>
      ) : trades.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-400">No hay trades registrados en esta fecha.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trades.map((trade) => {
            const isWin = trade.profit >= 0;
            return (
              <TradeCard 
                key={trade.id} 
                trade={trade} 
                isWin={isWin} 
                onEdit={handleOpenEdit} // <-- Pasamos la función al card
              />
            );
          })}
        </div>
      )}

      {/* --- RENDERIZAMOS EL MODAL AL FINAL --- */}
      <EditTradeModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveAnalysis}
        trade={editingTrade}
        strategies={strategies}
        emotions={emotions}
        mistakes={mistakes}
      />
    </div>
  );
}