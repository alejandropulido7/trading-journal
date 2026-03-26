import { useState, useEffect } from 'react';
import { Account } from '../types';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Añadimos el nuevo parámetro lossReason a la función onSubmit
  onSubmit: (id: number, alias: string, active: boolean, lossReason: string | null) => void;
  account: Account | null;
}

// Sugerencias rápidas para mejor UX
const COMMON_REASONS = [
  "Límite de pérdida diaria",
  "Drawdown máximo alcanzado",
  "Regla de consistencia",
  "Inactividad",
  "Operar en noticias"
];

export default function EditModal({ isOpen, onClose, onSubmit, account }: EditModalProps) {
  const [alias, setAlias] = useState("");
  const [active, setActive] = useState(true);
  const [lossReason, setLossReason] = useState(""); // <-- Nuevo estado

  useEffect(() => {
    if (account) {
        setAlias(account.alias);
        setActive(account.active);
        // Cargamos el motivo de pérdida si ya existía (por si estamos editando una cuenta ya inactiva)
        setLossReason(account.loss_reason || ""); 
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const handleSave = () => {
      // Pequeña validación: Si la estamos marcando como inactiva, que tenga al menos un motivo
      if (!active && !lossReason.trim()) {
          alert("Por favor, especifica el motivo por el cual la cuenta se desactivará.");
          return;
      }

      // Si se activa, enviamos null como motivo para limpiar la base de datos
      const finalReason = active ? null : lossReason;
      onSubmit(account.id, alias, active, finalReason);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-slate-100 my-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Editar Cuenta</h2>
        
        <div className="space-y-4">
            <div>
                <label className="text-xs text-slate-500 font-bold uppercase">Alias</label>
                <input 
                    type="text" 
                    className="w-full p-2 border border-slate-300 rounded mt-1 outline-none focus:border-blue-500"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input 
                    type="checkbox" 
                    id="isActive"
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Cuenta Activa (Monitorear)
                </label>
            </div>
            
            {/* --- NUEVO BLOQUE DINÁMICO --- */}
            {/* Solo se muestra si la casilla de "Cuenta Activa" NO está marcada */}
            {!active && (
              <div className="bg-rose-50 p-4 rounded-lg border border-rose-100 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                    Motivo de la pérdida / Inactivación
                  </label>
                  
                  <textarea
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value)}
                    placeholder="Ej: Toqué el límite diario por operar en venganza..."
                    className="w-full h-20 p-2 mt-2 border border-rose-200 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none text-sm"
                  />

                  {/* Botones de sugerencias rápidas */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {COMMON_REASONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setLossReason(suggestion)}
                        className="text-[10px] bg-white border border-rose-200 text-rose-600 px-2 py-1 rounded-full hover:bg-rose-100 transition"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
              </div>
            )}
            
            <p className="text-xs text-slate-400 mt-2">
                Si desactivas la cuenta, dejará de sincronizarse con la VPS y no aparecerá en el Dashboard principal.
            </p>

            <div className="flex gap-2 mt-6">
                <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition">
                    Cancelar
                </button>
                <button 
                    onClick={handleSave} // Usamos nuestra nueva función handleSave
                    className={`flex-1 py-2 text-white rounded-lg font-medium transition ${active ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                    Guardar Cambios
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}