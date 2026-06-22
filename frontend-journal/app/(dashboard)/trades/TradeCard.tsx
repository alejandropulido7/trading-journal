"use client";

import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ArrowUpCircle, ArrowDownCircle, Clock, Edit3 } from "lucide-react"; // <-- Importa Edit3
import { Trade } from "./types";

// <-- Agregamos onEdit a las props
export default function TradeCard({ trade, isWin, onEdit }: { trade: Trade; isWin: boolean; onEdit: (trade: Trade) => void }) {
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

        {/* --- NUEVO: MOSTRAR ETIQUETAS DE ANÁLISIS --- */}
        {(trade.strategy || trade.emotion || trade.mistake) && (
          <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-100">
            {trade.strategy && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{trade.strategy.name}</Badge>}
            {trade.emotion && <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">{trade.emotion.name}</Badge>}
            {trade.mistake && <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">{trade.mistake.name}</Badge>}
          </div>
        )}
      </CardContent>

      {/* --- MODIFICADO: Agregamos el botón onEdit --- */}
      <CardFooter className="pt-2 flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200">
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

        {/* Botón para analizar */}
        <Button 
            variant="outline" 
            size="icon" 
            onClick={() => onEdit(trade)} 
            className="border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 shrink-0"
            title="Analizar Trade"
        >
          <Edit3 size={18} />
        </Button>
      </CardFooter>
    </Card>
  );
}