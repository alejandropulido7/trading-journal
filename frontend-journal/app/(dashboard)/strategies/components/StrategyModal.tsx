"use client";

import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Strategy } from "../types";
import api from '@/app/lib/api'

interface StrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  strategyToEdit?: Strategy | null; // <-- NUEVO: Recibe la estrategia a editar
}

export default function StrategyModal({ isOpen, onClose, onSuccess, strategyToEdit }: StrategyModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<any[]>([{ tempId: Date.now(), condition: "", weight_percent: 0 }]);
  const [isSaving, setIsSaving] = useState(false);

  // --- NUEVO: Cargar datos si estamos en modo Edición ---
  useEffect(() => {
    if (strategyToEdit && isOpen) {
      setName(strategyToEdit.name);
      setDescription(strategyToEdit.description || "");
      // Mapeamos los items existentes y les asignamos un tempId para que React los maneje
      if (strategyToEdit.items && strategyToEdit.items.length > 0) {
        setItems(strategyToEdit.items.map(item => ({
          tempId: item.id || Math.random(), // Si viene del backend tiene ID
          condition: item.condition,
          weight_percent: item.weight_percent
        })));
      } else {
        setItems([{ tempId: Date.now(), condition: "", weight_percent: 0 }]);
      }
    } else if (isOpen) {
      // Modo Creación: Limpiar formulario
      setName("");
      setDescription("");
      setItems([{ tempId: Date.now(), condition: "", weight_percent: 0 }]);
    }
  }, [strategyToEdit, isOpen]);

  const totalWeight = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.weight_percent) || 0), 0);
  }, [items]);

  const addItem = () => setItems([...items, { tempId: Date.now(), condition: "", weight_percent: 0 }]);
  const removeItem = (tempId: number) => setItems(items.filter(item => item.tempId !== tempId));
  
  const updateItem = (tempId: number, field: string, value: any) => {
    setItems(items.map(item => item.tempId === tempId ? { ...item, [field]: value } : item));
  };

  const handleSave = async () => {
    if (totalWeight !== 100) {
      alert("El peso total de las reglas debe sumar exactamente 100%.");
      return;
    }
    if (!name.trim()) {
      alert("La estrategia debe tener un nombre.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name,
        description,
        items: items.map(item => ({
          condition: item.condition,
          weight_percent: Number(item.weight_percent)
        }))
      };

      // --- NUEVO: Decidir si es POST (Crear) o PUT (Editar) ---
      if (strategyToEdit) {
        await api.put(`http://localhost:8000/strategies/${strategyToEdit.id}`, payload);
      } else {
        await api.post("http://localhost:8000/strategies/", payload);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error guardando la estrategia:", error);
      alert("Hubo un error al guardar la estrategia.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isEditMode = !!strategyToEdit;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {isEditMode ? "Editar Estrategia" : "Crear Nueva Estrategia"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
            {/* ... Aquí va exactamente el mismo HTML de tu formulario ... */}
            {/* (Solo he acortado el código aquí para no repetir todo el HTML que ya tienes, mantenlo igual) */}
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre de la Estrategia</label>
                <Input placeholder="Ej: SMC + Liquidity Sweeps" value={name} onChange={e => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Descripción (Opcional)</label>
                <textarea placeholder="Describe brevemente en qué consiste tu ventaja estadística..." value={description} onChange={e => setDescription(e.target.value)} className="w-full h-20 p-3 mt-1 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"/>
              </div>
            </div>

            {/* SECCIÓN REGLAS */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <div><h3 className="font-bold text-slate-700">Reglas de Confluencia</h3></div>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Plus size={16} className="mr-1" /> Añadir Regla
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.tempId} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 w-6 text-center">{index + 1}.</span>
                    <Input placeholder="Ej: Quiebre de Estructura (BOS) en 15M" value={item.condition} onChange={e => updateItem(item.tempId, 'condition', e.target.value)} className="flex-1 h-9" />
                    <div className="relative w-24">
                      <Input type="number" min="1" max="100" value={item.weight_percent || ""} onChange={e => updateItem(item.tempId, 'weight_percent', e.target.value)} className="h-9 pr-8 text-right" />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.tempId)} disabled={items.length === 1} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>

              {/* PROGRESS BAR */}
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {totalWeight === 100 ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">✅ Pesos configurados correctamente</span>
                  ) : (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <AlertCircle size={16} /> Faltan {100 - totalWeight}% para completar
                    </span>
                  )}
                </div>
                <div className={`text-xl font-black ${totalWeight === 100 ? 'text-emerald-600' : totalWeight > 100 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {totalWeight}% / 100%
                </div>
              </div>
            </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving || totalWeight !== 100 || !name.trim()} className="bg-blue-600 hover:bg-blue-700 font-bold">
            {isSaving ? "Guardando..." : (isEditMode ? "Actualizar Estrategia" : "Guardar Estrategia")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}