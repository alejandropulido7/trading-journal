"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Server, Trash2, Plus, HardDrive } from "lucide-react";

interface ServerData {
  id: number;
  name: string;
  alias: string;
  active: boolean;
}

export default function ServersPage() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [newName, setNewName] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost:8000";

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const res = await axios.get(`${API_URL}/servers/`);
      setServers(res.data);
    } catch (error) {
      console.error("Error fetching servers", error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAlias) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/servers/`, {
        name: newName,
        alias: newAlias
      });
      setNewName("");
      setNewAlias("");
      fetchServers();
    } catch (error) {
      alert("Error al crear servidor (quizás ya existe)");
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar este servidor?")) return;
    try {
      await axios.delete(`${API_URL}/servers/${id}`);
      fetchServers();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-600 rounded-lg text-white">
            <HardDrive size={24} />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestión de Servidores</h1>
            <p className="text-slate-500">Configura los brokers disponibles para conectar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* FORMULARIO DE CREACIÓN */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Plus size={18} /> Nuevo Servidor
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Nombre Técnico (.srv)</label>
                    <input 
                        type="text" 
                        placeholder="Ej: FundedNext-Server" 
                        className="w-full p-2 border border-slate-200 rounded text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        required
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Debe coincidir exactamente con el archivo del MT5.</p>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Alias (Visible)</label>
                    <input 
                        type="text" 
                        placeholder="Ej: FundedNext Real" 
                        className="w-full p-2 border border-slate-200 rounded text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newAlias}
                        onChange={e => setNewAlias(e.target.value)}
                        required
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 transition disabled:opacity-50"
                >
                    {loading ? "Guardando..." : "Agregar Servidor"}
                </button>
            </form>
        </div>

        {/* LISTA DE SERVIDORES */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Servidores Registrados ({servers.length})</h3>
            </div>
            
            {servers.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                    No hay servidores configurados.
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {servers.map((srv) => (
                        <div key={srv.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded text-blue-600">
                                    <Server size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{srv.alias}</p>
                                    <p className="text-xs text-slate-400 font-mono">{srv.name}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDelete(srv.id)}
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition"
                                title="Eliminar"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}