"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";

// Componentes Shadcn (Asegúrate de haberlos instalado)
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ArrowUpCircle, ArrowDownCircle, Calendar, DollarSign, Clock } from "lucide-react";

// --- TIPOS ---
interface Trade {
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
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dateFilter, setDateFilter] = useState<string>(format(new Date(), 'yyyy-MM-dd')); // Default hoy
  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost:8000";

  // Función para buscar trades
  const fetchTrades = async (date: string) => {
    setLoading(true);
    try {
      // Enviamos la fecha como query param
      const res = await axios.get<Trade[]>(`${API_URL}/trades/?trade_date=${date}`);
      setTrades(res.data);
    } catch (error) {
      console.error("Error cargando trades", error);
    }
    setLoading(false);
  };

  // Efecto: Recargar cuando cambia la fecha
  useEffect(() => {
    fetchTrades(dateFilter);
  }, [dateFilter]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trades del Día</h1>
          <p className="text-slate-500">Revisión detallada operativa</p>
        </div>
        
        {/* FILTRO DE FECHA */}
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

      {/* GRID DE TRADES */}
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
              <TradeCard key={trade.id} trade={trade} isWin={isWin} />
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- COMPONENTE TARJETA INDIVIDUAL (Para limpieza) ---
function TradeCard({ trade, isWin }: { trade: Trade; isWin: boolean }) {
  const isBuy = trade.type === 'BUY';

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200 group">
      <CardHeader className="pb-3 flex flex-row justify-between items-start space-y-0">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
             {trade.account_alias}
          </p>
          <CardTitle className="text-lg font-bold text-slate-800 mt-1">{trade.symbol}</CardTitle>
        </div>
        <Badge variant={isWin ? "default" : "destructive"} className={`${isWin ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"} border-none px-2 py-0.5`}>
          {isWin ? "WIN" : "LOSS"}
        </Badge>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-2">
             <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 w-fit ${isBuy ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                {isBuy ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                {trade.type}
             </span>
             <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock size={12} />
                {format(new Date(trade.close_time), "HH:mm:ss")}
             </span>
          </div>
          <div className={`text-xl font-bold flex items-center ${isWin ? "text-emerald-600" : "text-red-600"}`}>
            {isWin ? "+" : ""}{trade.profit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        {/* --- MODAL DE DETALLES (DIALOG) --- */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200">
              Ver Detalles
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Detalles del Trade #{trade.ticket}</DialogTitle>
              <DialogDescription>
                Ejecutado en {trade.account_alias}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Símbolo</span>
                <span className="font-bold">{trade.symbol}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tipo</span>
                <span className={trade.type === 'BUY' ? 'text-blue-600 font-bold' : 'text-orange-600 font-bold'}>{trade.type}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Apertura</span>
                <span className="font-mono text-sm">{trade.open_time ? format(new Date(trade.open_time), "dd/MM HH:mm") : '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Cierre</span>
                <span className="font-mono text-sm">{format(new Date(trade.close_time), "dd/MM HH:mm")}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Comisión</span>
                <span className="text-red-500">-${Math.abs(trade.commission).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Swap</span>
                <span className="text-slate-800">${trade.swap.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                <span className="font-bold text-slate-700">Resultado Neto</span>
                <span className={`text-xl font-bold ${isWin ? "text-green-600" : "text-red-600"}`}>
                  {isWin ? "+" : ""}{trade.profit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}