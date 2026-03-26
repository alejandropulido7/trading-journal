"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format, subDays } from "date-fns";
import { Plus, Edit3, Trash2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TradeIdea } from "./types";
import TradeIdeaModal from "./components/TradeIdeaModal";

export default function TradeIdeasPage() {
  const [ideas, setIdeas] = useState<TradeIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [strategies, setStrategies] = useState([]);
  
  // Filtros de fecha (Por defecto los últimos 7 días)
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  // Paginación
  const [page, setPage] = useState(0);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);

  const API_URL = "http://localhost:8000";

  const fetchIdeas = async (currentPage: number) => {
    setLoading(true);
    try {
      const skip = currentPage * limit;
      const res = await axios.get<TradeIdea[]>(`${API_URL}/trade-ideas/`, {
        params: { start_date: startDate, end_date: endDate, skip, limit }
      });
      setIdeas(res.data);
      setHasMore(res.data.length === limit);
    } catch (error) {
      console.error("Error cargando ideas", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIdeas(page);
  }, [startDate, endDate, page]);

  useEffect(() => {
    axios.get("http://localhost:8000/strategies/").then(res => setStrategies(res.data));
  }, []);

  // --- ACCIONES ---
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await axios.patch(`${API_URL}/trade-ideas/${id}/status`, { status: newStatus });
      setIdeas(ideas.map(idea => idea.id === id ? { ...idea, status: newStatus as any } : idea));
    } catch (error) {
      alert("Error actualizando estado");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta idea de trade?")) return;
    try {
      await axios.delete(`${API_URL}/trade-ideas/${id}`);
      setIdeas(ideas.filter(idea => idea.id !== id));
    } catch (error) {
      alert("Error eliminando idea");
    }
  };

  // Helper para pintar el estado
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "DRAFT": return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Clock size={12} className="mr-1"/> Borrador</Badge>;
      case "EXECUTED": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle size={12} className="mr-1"/> Ejecutado</Badge>;
      case "DISCARDED": return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100"><XCircle size={12} className="mr-1"/> Descartado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trade Ideas</h1>
          <p className="text-slate-500">Planifica, analiza y ejecuta (Pre-Trade Setups)</p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)} className="...">
            <Plus size={18} className="mr-2" /> Nueva Idea
        </Button>
      </div>

      {/* FILTROS */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Desde:</span>
          <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(0); }} className="w-40" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Hasta:</span>
          <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(0); }} className="w-40" />
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
            <tr>
              <th className="px-6 py-4">Fecha / Hora</th>
              <th className="px-6 py-4">Activo</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Confluencias</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10">Cargando...</td></tr>
            ) : ideas.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400">No hay ideas de trade en este rango de fechas.</td></tr>
            ) : (
              ideas.map((idea) => (
                <tr key={idea.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-mono">{format(new Date(idea.created_at), "dd/MM/yy HH:mm")}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{idea.asset}</td>
                  <td className="px-6 py-4"><StatusBadge status={idea.status} /></td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded">
                      {idea.checklist.filter(c => c.is_active).length} items activos
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    {/* Botones de Acción */}
                    <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                      <select 
                        className="text-xs px-2 py-1.5 outline-none border-r border-slate-200 cursor-pointer hover:bg-slate-50"
                        value={idea.status}
                        onChange={(e) => handleStatusChange(idea.id, e.target.value)}
                      >
                        <option value="DRAFT">Borrador</option>
                        <option value="EXECUTED">Ejecutado</option>
                        <option value="DISCARDED">Descartado</option>
                      </select>
                      
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 transition" title="Editar">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(idea.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 transition" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-slate-500">Página {page + 1}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft size={16} className="mr-1" /> Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!hasMore}>
            Siguiente <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>

      <TradeIdeaModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => fetchIdeas(0)} // Refresca la tabla al guardar
            strategies={strategies} 
        />
    </div>
  );
}