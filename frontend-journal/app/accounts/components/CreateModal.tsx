import { Dispatch, SetStateAction, FormEvent } from 'react';
import { AccountCreate, Server } from '../types';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  newAcc: AccountCreate;
  setNewAcc: Dispatch<SetStateAction<AccountCreate>>;
  servers: Server[];
}

export default function CreateModal({ isOpen, onClose, onSubmit, newAcc, setNewAcc, servers }: CreateModalProps) {
  if (!isOpen) return null;
  const isTargetEnabled = newAcc.account_type === "Phase 1" || newAcc.account_type === "Phase 2";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-100">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-2xl font-bold text-slate-800">Nueva Cuenta</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-light">✕</button>
        </div>
        
        <form onSubmit={onSubmit}>
          {/* SECCIÓN 1: CREDENCIALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="border-slate-300 col-1 md:col-1">          
            <div className="col-span-1 md:col-span-1">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 bg-blue-50 p-2 rounded inline-block">Credenciales MT5</h3>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Login ID</label>
              <input type="number" placeholder="Ej: 819203" className="p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" required
                value={newAcc.login_id} onChange={e => setNewAcc({...newAcc, login_id: e.target.value})} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Password</label>
              <input type="password" placeholder="••••••••" className="p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required
                value={newAcc.password} onChange={e => setNewAcc({...newAcc, password: e.target.value})} />
            </div>

            <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Server</label>
              <select 
                  className="p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newAcc.server} 
                  onChange={e => setNewAcc({...newAcc, server: e.target.value})}
                  required
              >
                  <option value="" disabled>Selecciona un servidor</option>
                  {servers.map(srv => <option key={srv.name} value={srv.name}>{srv.name}</option>)}
              </select>
            </div>
          </div>

          {/* SECCIÓN 2: REGLAS DE RIESGO (NUEVO) */}
          <div className="border-slate-300 col-span-1 md:col-2">
            <div className="col-span-1 md:col-span-1">
                <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3 bg-rose-50 p-2 rounded inline-block">Reglas de Riesgo (Prop Firm)</h3>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Max Drawdown (%)</label>
                <input type="number" step="0.1" placeholder="Ej: 10" className="p-2.5 border border-gray-200 rounded-lg outline-none"
                value={newAcc.max_drawdown_limit} onChange={e => setNewAcc({...newAcc, max_drawdown_limit: e.target.value})} />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Daily Drawdown (%)</label>
                <input type="number" step="0.1" placeholder="Ej: 5" className="p-2.5 border border-gray-200 rounded-lg outline-none"
                value={newAcc.daily_drawdown_limit} onChange={e => setNewAcc({...newAcc, daily_drawdown_limit: e.target.value})} />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Regla Consistencia (%)</label>
                <input type="number" step="1" placeholder="0 si no aplica" className="p-2.5 border border-gray-200 rounded-lg outline-none"
                value={newAcc.consistency_rule} onChange={e => setNewAcc({...newAcc, consistency_rule: e.target.value})} />
            </div>

            <div className="flex items-center gap-2 mt-6">
                <input 
                    type="checkbox" 
                    id="trailing"
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={newAcc.trailing_drawdown}
                    onChange={e => setNewAcc({...newAcc, trailing_drawdown: e.target.checked})}
                />
                <label htmlFor="trailing" className="text-sm text-gray-600 font-medium cursor-pointer">
                    Activar Trailing Drawdown
                </label>
            </div>
          </div>
          </div>

          {/* SECCIÓN 3: DATOS DEL JOURNAL */}
          <div className="border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-1 md:col-span-2 mt-2">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 bg-blue-50 p-2 rounded inline-block">Configuración Journal</h3>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Prop Firm</label>
              <input type="text" placeholder="Ej: FTMO" className="p-2.5 bg-slate-50 border border-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" disabled
                value={newAcc.prop_firm || (servers.find(s => s.name === newAcc.server)?.alias || "")}
                onChange={e => setNewAcc({...newAcc, prop_firm: e.target.value})}
                />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Alias</label>
              <input type="text" placeholder="Ej: Cuenta Fase 1" className="p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required
                value={newAcc.alias} onChange={e => setNewAcc({...newAcc, alias: e.target.value})} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Tipo</label>
              <select className="p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={newAcc.account_type} 
                  onChange={e => {
                      const type = e.target.value;
                      const isEvaluation = type === "Phase 1" || type === "Phase 2";
                      setNewAcc({
                          ...newAcc, 
                          account_type: type,
                          target_percent: isEvaluation ? newAcc.target_percent : "0"
                      });
                  }}
                  >
                  <option value="Phase 1">Phase 1</option>
                  <option value="Phase 2">Phase 2</option>
                  <option value="Funded">Funded</option>
                  <option value="Personal">Personal</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Balance Inicial</label>
              <input type="number" placeholder="Ej: 10000" className="p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required
                value={newAcc.initial_balance} onChange={e => setNewAcc({...newAcc, initial_balance: e.target.value})} />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Riesgo por Trade %</label>
                <input type="number" step="0.1" placeholder="1.0" className="p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={newAcc.risk_per_trade} onChange={e => setNewAcc({...newAcc, risk_per_trade: e.target.value})} />
            </div>
            
            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Objetivo %</label>
                <input type="number" step="0.1" 
                className={`p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${!isTargetEnabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                value={newAcc.target_percent} 
                onChange={e => setNewAcc({...newAcc, target_percent: e.target.value})} 
                disabled={!isTargetEnabled}
                />
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Inversión (USD)</label>
                <input type="number" placeholder="Costo de la prueba" className="p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={newAcc.investment} onChange={e => setNewAcc({...newAcc, investment: e.target.value})} />
            </div>
          

          <button type="submit" className="col-span-1 md:col-span-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-lg font-bold hover:shadow-lg transition transform hover:-translate-y-0.5 mt-4">
            Guardar Cuenta
          </button>
          </div>
        </form>
      </div>
    </div>
  );
}