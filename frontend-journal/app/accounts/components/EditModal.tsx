// app/accounts/components/EditModal.tsx
import { useState, useEffect } from 'react';
import { Account } from '../types';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, alias: string, active: boolean) => void;
  account: Account | null;
}

export default function EditModal({ isOpen, onClose, onSubmit, account }: EditModalProps) {
  const [alias, setAlias] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (account) {
        setAlias(account.alias);
        setActive(account.active);
    }
  }, [account]);

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-slate-100">
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
            
            <p className="text-xs text-slate-400">
                Si desactivas la cuenta, dejará de sincronizarse con la VPS y no aparecerá en el Dashboard principal.
            </p>

            <div className="flex gap-2 mt-6">
                <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition">
                    Cancelar
                </button>
                <button 
                    onClick={() => onSubmit(account.id, alias, active)}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                    Guardar Cambios
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}