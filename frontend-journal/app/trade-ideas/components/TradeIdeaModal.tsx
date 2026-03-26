"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";

interface EvidenceDraft {
  tempId: number; // ID temporal para React Key
  timeframe: string;
  note: string;
  file: File | null;
}

export default function TradeIdeaModal({ isOpen, onClose, onSuccess, strategies }: any) {
  const [asset, setAsset] = useState("");
  const [strategyId, setStrategyId] = useState("");
  const [checklist, setChecklist] = useState<any[]>([]);
  const [evidences, setEvidences] = useState<EvidenceDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Cuando elige una estrategia, cargamos sus items en el checklist
  useEffect(() => {
    if (strategyId && strategies.length > 0) {
      const selected = strategies.find((s: any) => s.id.toString() === strategyId);
      if (selected && selected.items) {
        setChecklist(selected.items.map((item: any) => ({
          strategy_item_id: item.id,
          condition: item.condition,
          weight_percent: item.weight_percent,
          is_active: false,
          direction: ""
        })));
      }
    } else {
      setChecklist([]);
    }
  }, [strategyId, strategies]);

  // 2. Motor de Cálculo de Probabilidades en vivo
  const probabilities = useMemo(() => {
    let buy = 0;
    let sell = 0;
    checklist.forEach(item => {
      if (item.is_active && item.direction === "BUY") buy += item.weight_percent;
      if (item.is_active && item.direction === "SELL") sell += item.weight_percent;
    });
    return { buy, sell };
  }, [checklist]);

  const updateChecklist = (itemId: number, field: string, value: any) => {
    setChecklist(prev => prev.map(item => 
      item.strategy_item_id === itemId ? { ...item, [field]: value } : item
    ));
  };

  // 3. Lógica de Evidencias Dinámicas
  const addEvidence = () => {
    setEvidences([...evidences, { tempId: Date.now(), timeframe: "", note: "", file: null }]);
  };

  const removeEvidence = (tempId: number) => {
    setEvidences(evidences.filter(ev => ev.tempId !== tempId));
  };

  const updateEvidence = (tempId: number, field: keyof EvidenceDraft, value: any) => {
    setEvidences(evidences.map(ev => 
      ev.tempId === tempId ? { ...ev, [field]: value } : ev
    ));
  };

  // 4. GUARDADO EN DOS PASOS
  const handleSave = async () => {
    if (!asset || !strategyId) {
      alert("Debes seleccionar un activo y una estrategia.");
      return;
    }

    setIsSaving(true);
    try {
      // PASO 1: Guardar la Idea y el Checklist en JSON
      const ideaPayload = {
        asset,
        strategy_id: parseInt(strategyId),
        checklist: checklist.map(item => ({
          strategy_item_id: item.strategy_item_id,
          is_active: item.is_active,
          direction: item.direction || null
        }))
      };

      const res = await axios.post("http://localhost:8000/trade-ideas/", ideaPayload);
      const newIdeaId = res.data.id;

      // PASO 2: Subir las evidencias (Imágenes) una por una
      // Usamos Promise.all para subirlas en paralelo y hacerlo súper rápido
      if (evidences.length > 0) {
        const uploadPromises = evidences.map(async (ev) => {
          if (!ev.timeframe || !ev.file) return null; // Ignoramos si está incompleto

          const formData = new FormData();
          formData.append("timeframe", ev.timeframe);
          formData.append("note", ev.note);
          formData.append("file", ev.file);

          return axios.post(`http://localhost:8000/trade-ideas/${newIdeaId}/evidences/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        });

        await Promise.all(uploadPromises);
      }

      // Limpiar y cerrar
      setAsset(""); setStrategyId(""); setChecklist([]); setEvidences([]);
      onSuccess(); // Refresca la tabla principal
      onClose();
    } catch (error) {
      console.error("Error guardando idea:", error);
      alert("Hubo un error al guardar la idea de trade.");
    }
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Usamos max-w-4xl para que el modal sea ancho y quepa todo el checklist y fotos */}
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Nueva Idea de Trade</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-8">
          
          {/* SECCIÓN 1: DATOS BÁSICOS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Activo (Par / Índice)</label>
              <Input placeholder="Ej: EURUSD, US30" value={asset} onChange={e => setAsset(e.target.value.toUpperCase())} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Estrategia a Evaluar</label>
              <select 
                value={strategyId} onChange={e => setStrategyId(e.target.value)} 
                className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Seleccionar Estrategia --</option>
                {strategies.map((st: any) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SECCIÓN 2: CHECKLIST Y PROBABILIDADES (Solo si hay estrategia elegida) */}
          {checklist.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700">Confluencias (Checklist)</h3>
                
                {/* PROBABILÍMETRO */}
                <div className="flex gap-4 items-center bg-slate-900 px-4 py-2 rounded-lg text-white">
                    <div className="text-center">
                        <span className="text-[10px] text-slate-400 uppercase block">Buy Prob</span>
                        <span className="font-bold text-emerald-400">{probabilities.buy}%</span>
                    </div>
                    <div className="w-px h-6 bg-slate-700"></div>
                    <div className="text-center">
                        <span className="text-[10px] text-slate-400 uppercase block">Sell Prob</span>
                        <span className="font-bold text-rose-400">{probabilities.sell}%</span>
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                {checklist.map((item) => (
                  <div key={item.strategy_item_id} className="flex items-center gap-3 bg-white p-2 rounded border border-slate-200">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4"
                      checked={item.is_active}
                      onChange={e => updateChecklist(item.strategy_item_id, 'is_active', e.target.checked)}
                    />
                    <div className="flex-1">
                      <span className="text-sm text-slate-700">{item.condition}</span>
                      <span className="text-xs text-slate-400 ml-2">({item.weight_percent}%)</span>
                    </div>
                    <select 
                      disabled={!item.is_active}
                      value={item.direction}
                      onChange={e => updateChecklist(item.strategy_item_id, 'direction', e.target.value)}
                      className="text-sm p-1 border rounded w-24"
                    >
                      <option value="">--</option>
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN 3: EVIDENCIAS DINÁMICAS (Fotos y Notas) */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-700">Evidencias Fotográficas</h3>
              <Button type="button" variant="outline" size="sm" onClick={addEvidence} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                <Plus size={16} className="mr-1" /> Añadir Temporalidad
              </Button>
            </div>

            <div className="space-y-3">
              {evidences.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 border border-dashed rounded">No has agregado evidencias fotográficas a esta idea.</p>
              )}
              
              {evidences.map((ev, index) => (
                <div key={ev.tempId} className="flex flex-col md:flex-row gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {/* Selector de Temporalidad */}
                  <select 
                    value={ev.timeframe} 
                    onChange={e => updateEvidence(ev.tempId, 'timeframe', e.target.value)}
                    className="h-10 border rounded px-2 w-full md:w-28 text-sm"
                  >
                    <option value="">TF...</option>
                    <option value="Daily">Daily</option>
                    <option value="4H">4H</option>
                    <option value="1H">1H</option>
                    <option value="15M">15M</option>
                    <option value="5M">5M</option>
                    <option value="1M">1M</option>
                  </select>

                  {/* Input de Nota */}
                  <Input 
                    placeholder="Nota analítica (Ej: Rechazo en FVG...)" 
                    value={ev.note} 
                    onChange={e => updateEvidence(ev.tempId, 'note', e.target.value)}
                    className="flex-1 bg-white"
                  />

                  {/* Input de Archivo Fotográfico */}
                  <div className="flex items-center gap-2 bg-white border rounded px-2 w-full md:w-64 overflow-hidden">
                    <ImageIcon size={16} className="text-slate-400 shrink-0" />
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files && e.target.files.length > 0) {
                          updateEvidence(ev.tempId, 'file', e.target.files[0]);
                        }
                      }}
                      className="text-xs w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  {/* Eliminar Fila */}
                  <Button variant="ghost" size="icon" onClick={() => removeEvidence(ev.tempId)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0">
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving || !asset || !strategyId} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? "Guardando..." : "Guardar Idea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}