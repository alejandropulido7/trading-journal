"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Image as ImageIcon, ClipboardPaste } from "lucide-react";
import api from '@/app/lib/api'

interface EvidenceDraft {
  tempId: number;
  timeframe: string;
  note: string;
  file: File | null;
  previewUrl: string | null; // Feedback visual del paste
}

export default function TradeIdeaModal({ isOpen, onClose, onSuccess, strategies }: any) {
  const [asset, setAsset] = useState("");
  const [strategyId, setStrategyId] = useState("");
  const [checklist, setChecklist] = useState<any[]>([]);
  const [evidences, setEvidences] = useState<EvidenceDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 1. CARGA DE CHECKLIST DINÁMICO
  useEffect(() => {
    if (strategyId && strategies.length > 0) {
      // Búsqueda en memoria del grafo de la estrategia seleccionada
      const selected = strategies.find((s: any) => s.id.toString() === strategyId);
      
      // Mapeo defensivo de los DTOs hijos hacia el estado de mutación local
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
      setChecklist([]); // Garbage collection del estado local si se deselecciona
    }
  }, [strategyId, strategies]);

  // 2. MOTOR DE PROBABILIDAD EN TIEMPO REAL
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

  // 3. GESTIÓN DE EVIDENCIAS Y PORTAPAPELES (PASTE)
  const addEvidence = () => {
    setEvidences([...evidences, { tempId: Date.now(), timeframe: "", note: "", file: null, previewUrl: null }]);
  };

  const removeEvidence = (tempId: number) => {
    // Prevención de memory leaks revocando la URL del Blob
    const target = evidences.find(ev => ev.tempId === tempId);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    
    setEvidences(evidences.filter(ev => ev.tempId !== tempId));
  };

  const updateEvidenceFile = (tempId: number, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setEvidences(prev => prev.map(ev => {
      if (ev.tempId === tempId) {
        if (ev.previewUrl) URL.revokeObjectURL(ev.previewUrl); // Limpiar previo si se sobreescribe
        return { ...ev, file, previewUrl };
      }
      return ev;
    }));
  };

  const updateEvidenceField = (tempId: number, field: keyof EvidenceDraft, value: any) => {
    setEvidences(prev => prev.map(ev => ev.tempId === tempId ? { ...ev, [field]: value } : ev));
  };

  // Event Handler para el Ctrl+V / Cmd+V
  const handlePaste = (e: React.ClipboardEvent, tempId: number) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          updateEvidenceFile(tempId, file);
          e.preventDefault(); // Evitar comportamiento por defecto del navegador
        }
        break; // Procesar solo la primera imagen en el portapapeles
      }
    }
  };

  // 4. PERSISTENCIA Y ORQUESTACIÓN HTTP
  const handleSave = async () => {
    if (!asset || !strategyId) {
      alert("La arquitectura requiere la selección de un activo y una estrategia base.");
      return;
    }

    setIsSaving(true);
    try {
      // POST 1: Transacción JSON Base
      const ideaPayload = {
        asset,
        strategy_id: parseInt(strategyId),
        checklist: checklist.map(item => ({
          strategy_item_id: item.strategy_item_id,
          is_active: item.is_active,
          direction: item.direction || null
        }))
      };

      const res = await api.post("http://localhost:8000/trade-ideas/", ideaPayload);
      const newIdeaId = res.data.id;

      // POST 2: Transmisión Multipart/form-data asíncrona concurrente
      if (evidences.length > 0) {
        const uploadPromises = evidences.map(async (ev) => {
          if (!ev.timeframe || !ev.file) return null;

          const formData = new FormData();
          formData.append("timeframe", ev.timeframe);
          formData.append("note", ev.note);
          formData.append("file", ev.file);

          return api.post(`http://localhost:8000/trade-ideas/${newIdeaId}/evidences/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        });
        await Promise.all(uploadPromises);
      }

      // Cleanup final de blobs para Garbage Collection
      evidences.forEach(ev => ev.previewUrl && URL.revokeObjectURL(ev.previewUrl));
      
      setAsset(""); setStrategyId(""); setChecklist([]); setEvidences([]);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Fallo en la persistencia transaccional:", error);
      alert("Excepción durante el proceso de guardado. Revisa la consola.");
    }
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        evidences.forEach(ev => ev.previewUrl && URL.revokeObjectURL(ev.previewUrl));
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Modelado de Trade Idea</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-8">
          
          {/* SECCIÓN 1: METADATOS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Activo Subyacente</label>
              <Input placeholder="Ej: EURUSD" value={asset} onChange={e => setAsset(e.target.value.toUpperCase())} className="mt-1 font-mono" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Estructura Estratégica</label>
              <select 
                value={strategyId} onChange={e => setStrategyId(e.target.value)} 
                className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Seleccionar --</option>
                {strategies.map((st: any) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SECCIÓN 2: MATRIZ DE CONFLUENCIAS Y PROBABILÍMETRO */}
          {checklist.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700">Matriz de Confluencias</h3>
                
                <div className="flex gap-4 items-center bg-slate-900 px-4 py-2 rounded-lg text-white shadow-inner">
                    <div className="text-center">
                        <span className="text-[10px] text-slate-400 uppercase block tracking-widest">Buy Bias</span>
                        <span className="font-black text-lg text-emerald-400">{probabilities.buy}%</span>
                    </div>
                    <div className="w-px h-6 bg-slate-700"></div>
                    <div className="text-center">
                        <span className="text-[10px] text-slate-400 uppercase block tracking-widest">Sell Bias</span>
                        <span className="font-black text-lg text-rose-400">{probabilities.sell}%</span>
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                {checklist.map((item) => (
                  <div key={item.strategy_item_id} className="flex items-center gap-3 bg-white p-2.5 rounded border border-slate-200 hover:border-blue-200 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      checked={item.is_active}
                      onChange={e => updateChecklist(item.strategy_item_id, 'is_active', e.target.checked)}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-700">{item.condition}</span>
                      <span className="text-xs font-bold text-slate-400 ml-2 bg-slate-100 px-1.5 py-0.5 rounded">W: {item.weight_percent}%</span>
                    </div>
                    <select 
                      disabled={!item.is_active}
                      value={item.direction}
                      onChange={e => updateChecklist(item.strategy_item_id, 'direction', e.target.value)}
                      className="text-sm p-1.5 border rounded w-24 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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

          {/* SECCIÓN 3: EVIDENCIAS (DRAG/DROP & PASTE ZONE) */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-700">Evidencias Multi-Timeframe</h3>
              <Button type="button" variant="outline" size="sm" onClick={addEvidence} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                <Plus size={16} className="mr-1" /> Añadir Layer
              </Button>
            </div>

            <div className="space-y-3">
              {evidences.map((ev) => (
                <div key={ev.tempId} className="flex flex-col md:flex-row gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-sm relative">
                  
                  <select 
                    value={ev.timeframe} 
                    onChange={e => updateEvidenceField(ev.tempId, 'timeframe', e.target.value)}
                    className="h-10 border rounded px-2 w-full md:w-24 text-sm bg-white font-mono"
                  >
                    <option value="">TF...</option>
                    <option value="D1">D1</option>
                    <option value="H4">H4</option>
                    <option value="H1">H1</option>
                    <option value="M15">M15</option>
                    <option value="M5">M5</option>
                    <option value="M1">M1</option>
                  </select>

                  <Input 
                    placeholder="Rationale (Ej: Inducement mitigation...)" 
                    value={ev.note} 
                    onChange={e => updateEvidenceField(ev.tempId, 'note', e.target.value)}
                    className="flex-1 bg-white"
                  />

                  {/* ZONA DE PASTE / PREVIEW */}
                  <div 
                    tabIndex={0}
                    onPaste={(e) => handlePaste(e, ev.tempId)}
                    className={`flex items-center gap-2 border rounded w-full md:w-64 overflow-hidden relative transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${ev.previewUrl ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-300 hover:bg-slate-100 cursor-pointer'}`}
                  >
                    {ev.previewUrl ? (
                      <div className="w-full flex items-center justify-between px-2 h-10">
                        <div className="flex items-center gap-2 truncate">
                          <img src={ev.previewUrl} alt="preview" className="h-6 w-8 object-cover rounded border border-blue-200" />
                          <span className="text-xs text-blue-700 font-medium truncate">{ev.file?.name || 'Imagen_Clipboard.png'}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600" onClick={(e) => { e.stopPropagation(); updateEvidenceField(ev.tempId, 'file', null); updateEvidenceField(ev.tempId, 'previewUrl', null); }}>
                           <Trash2 size={12} />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full h-10 flex items-center justify-center gap-2 text-xs text-slate-500 relative">
                        <ClipboardPaste size={14} className="text-slate-400" />
                        <span>Clic y <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-mono">Ctrl+V</kbd> para imagen</span>
                        {/* Fallback de input de archivo oculto bajo el div */}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          onChange={e => {
                            if (e.target.files && e.target.files.length > 0) {
                              updateEvidenceFile(ev.tempId, e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => removeEvidence(ev.tempId)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0">
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Abortar</Button>
          <Button onClick={handleSave} disabled={isSaving || !asset || !strategyId} className="bg-blue-600 hover:bg-blue-700 font-bold">
            {isSaving ? "Sincronizando..." : "Comitear Idea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}