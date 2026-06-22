"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Target, LayoutList, Trash2, Edit3 } from "lucide-react";
import { Strategy } from "./types";
import { Button } from "@/components/ui/button";
import StrategyModal from "./components/StrategyModal";
import api from '@/app/lib/api'

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  // --- NUEVO: Estado para saber qué estrategia estamos editando ---
  const [strategyToEdit, setStrategyToEdit] = useState<Strategy | null>(null);

  const API_URL = "http://localhost:8000";

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    setLoading(true);
    try {
      const response = await api.get<Strategy[]>(`${API_URL}/strategies/`);
      setStrategies(response.data);
    } catch (error) {
      console.error("Error cargando estrategias:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- NUEVO: Función para abrir el modal en modo Edición ---
  const handleEdit = (strategy: Strategy) => {
    setStrategyToEdit(strategy);
    setIsModalOpen(true);
  };

  // --- NUEVO: Función para abrir el modal en modo Creación ---
  const handleCreate = () => {
    setStrategyToEdit(null);
    setIsModalOpen(true);
  };

  // --- NUEVO: Función para Eliminar ---
  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta estrategia? Todas las ideas de trade asociadas a ella también podrían verse afectadas.")) return;
    
    try {
      await api.delete(`${API_URL}/strategies/${id}`);
      setStrategies(strategies.filter(s => s.id !== id));
    } catch (error) {
      console.error("Error eliminando:", error);
      alert("Hubo un error al eliminar la estrategia.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="text-blue-600" size={28} />
            Estrategias
          </h1>
          <p className="text-slate-500 mt-1">Gestiona tus sistemas de trading y sus reglas de confluencia.</p>
        </div>
        
        {/* Cambiamos el onClick a handleCreate */}
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-sm">
          <Plus size={18} className="mr-2" />
          Nueva Estrategia
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : strategies.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
          <Target className="mx-auto text-slate-300 mb-3" size={48} />
          <h3 className="text-lg font-bold text-slate-700">No tienes estrategias</h3>
          <Button variant="outline" onClick={handleCreate} className="mt-4">Crear mi primera estrategia</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{strategy.name}</h3>
                <div className="flex gap-1 text-slate-400">
                  {/* --- NUEVO: Conectamos los botones de acción --- */}
                  <button onClick={() => handleEdit(strategy)} className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Editar">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(strategy.id)} className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded transition" title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{strategy.description || "Sin descripción proporcionada."}</p>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                <div className="flex items-center text-slate-600 font-medium">
                  <LayoutList size={16} className="mr-1.5 text-slate-400" />
                  {strategy.items?.length || 0} Reglas
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded">
                  {strategy.items?.reduce((acc, item) => acc + item.weight_percent, 0) || 0}% Total
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pasamos strategyToEdit al modal */}
      <StrategyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchStrategies}
        strategyToEdit={strategyToEdit} 
      />
    </div>
  );
}