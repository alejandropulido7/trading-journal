"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EditTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tradeId: number, data: any) => void;
  trade: any;
  strategies: any[];
  emotions: any[];
  mistakes: any[];
}

export default function EditTradeModal({ isOpen, onClose, onSave, trade, strategies, emotions, mistakes }: EditTradeModalProps) {
  const [strategyId, setStrategyId] = useState("");
  const [emotionId, setEmotionId] = useState("");
  const [mistakeId, setMistakeId] = useState("");

  // Cargar datos actuales cuando se abre el modal
  useEffect(() => {
    if (trade) {
      setStrategyId(trade.strategy_id?.toString() || "");
      setEmotionId(trade.emotion_id?.toString() || "");
      setMistakeId(trade.mistake_id?.toString() || "");
    }
  }, [trade, isOpen]);

  const handleSave = () => {
    onSave(trade.id, {
      strategy_id: strategyId ? parseInt(strategyId) : null,
      emotion_id: emotionId ? parseInt(emotionId) : null,
      mistake_id: mistakeId ? parseInt(mistakeId) : null,
    });
  };

  if (!trade) return null;

  // Estilo base para los selects simulando el Input de Shadcn
  const selectClassName = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Analizar Trade</DialogTitle>
          <DialogDescription>
            {trade.symbol} • {trade.profit >= 0 ? "Ganancia" : "Pérdida"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-5 py-4">
          
          {/* ESTRATEGIA */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estrategia Usada</label>
            <select value={strategyId} onChange={(e) => setStrategyId(e.target.value)} className={selectClassName}>
              <option value="">-- Sin estrategia --</option>
              {strategies.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* EMOCIÓN */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Emoción Dominante</label>
            <select value={emotionId} onChange={(e) => setEmotionId(e.target.value)} className={selectClassName}>
              <option value="">-- Sin emoción --</option>
              {emotions.map((em) => (
                <option key={em.id} value={em.id}>{em.name}</option>
              ))}
            </select>
          </div>

          {/* ERROR */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Error Técnico / Mental</label>
            <select value={mistakeId} onChange={(e) => setMistakeId(e.target.value)} className={selectClassName}>
              <option value="">-- Ninguno / Trade Perfecto --</option>
              {mistakes.map((mk) => (
                <option key={mk.id} value={mk.id}>{mk.name}</option>
              ))}
            </select>
          </div>

        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Guardar Análisis</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}