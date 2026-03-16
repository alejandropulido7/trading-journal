"use client";
import { useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, Target } from 'lucide-react';

interface StrategyItem {
  condition: string;
  weight_percent: number;
}

export default function StrategyBuilder() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // Estado inicial dinámico: Comienza con un item vacío
  const [items, setItems] = useState<StrategyItem[]>([{ condition: "", weight_percent: 0 }]);

  // --- LÓGICA DINÁMICA ---
  const handleAddItem = () => {
    setItems([...items, { condition: "", weight_percent: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleChangeItem = (index: number, field: keyof StrategyItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Calcular el total de probabilidad/importancia
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight_percent) || 0), 0);

  const handleSave = async () => {
    if (totalWeight !== 100) {
        alert("La suma de los porcentajes debe ser exactamente 100%");
        return;
    }
    try {
        await axios.post('http://localhost:8000/strategies/', { name, description, items });
        alert("Estrategia guardada con éxito");
        // Resetear formulario
        setName(""); setDescription(""); setItems([{ condition: "", weight_percent: 0 }]);
    } catch (error) {
        alert("Error guardando estrategia");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <Target className="text-blue-600" size={28} />
          <h2 className="text-2xl font-bold text-slate-800">Constructor de Estrategia</h2>
      </div>

      {/* Info General */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Nombre de Estrategia</label>
            <input type="text" className="w-full p-2 border rounded mt-1 outline-blue-500" placeholder="Ej: Breakout Asiático" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Descripción</label>
            <input type="text" className="w-full p-2 border rounded mt-1 outline-blue-500" placeholder="Ej: Operar rupturas de consolidación" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>

      {/* Items Dinámicos */}
      <h3 className="text-sm font-bold text-slate-700 mb-3">Condiciones (Confluencias)</h3>
      
      {items.map((item, index) => (
        <div key={index} className="flex gap-3 items-start mb-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="flex-1">
                <input 
                    type="text" 
                    placeholder="Ej: RSI < 30 (Sobrevendido)" 
                    className="w-full p-2 border rounded outline-blue-500"
                    value={item.condition}
                    onChange={(e) => handleChangeItem(index, 'condition', e.target.value)}
                />
            </div>
            <div className="w-32 relative">
                <input 
                    type="number" 
                    placeholder="25" 
                    className="w-full p-2 border rounded outline-blue-500 pr-8 text-right font-mono"
                    value={item.weight_percent || ''}
                    onChange={(e) => handleChangeItem(index, 'weight_percent', parseFloat(e.target.value))}
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
            </div>
            {items.length > 1 && (
                <button onClick={() => handleRemoveItem(index)} className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition">
                    <Trash2 size={18} />
                </button>
            )}
        </div>
      ))}

      {/* Agregar Fila */}
      <button onClick={handleAddItem} className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 mt-2">
          <Plus size={16} /> Agregar Condición
      </button>

      {/* Totalizador y Guardado */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500">Peso Total:</span>
              <span className={`text-xl font-black ${totalWeight === 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {totalWeight}%
              </span>
              {totalWeight !== 100 && <span className="text-xs text-rose-500 ml-2">(Debe ser 100%)</span>}
          </div>
          <button 
              onClick={handleSave} 
              disabled={totalWeight !== 100 || !name}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
              <Save size={18} /> Guardar Estrategia
          </button>
      </div>
    </div>
  );
}