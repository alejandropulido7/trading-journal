import { Server, TrendingUp, TrendingDown, ShieldAlert, Target, Edit, Trash2 } from 'lucide-react';
import { Account } from '../types';

interface AccountCardProps {
  acc: Account;
  // Nuevas props para las acciones
  onEdit: (acc: Account) => void;
  onDelete: (id: number) => void;
}

export default function AccountCard({ acc, onEdit, onDelete }: AccountCardProps) {
  // --- LÓGICA VISUAL (PLAN B) ---
  const calculatedPL = acc.balance - acc.initial_balance;
  const calculatedPercent = acc.initial_balance > 0 
      ? ((calculatedPL / acc.initial_balance) * 100) 
      : 0;
  const isPositive = calculatedPL >= 0;

  return (
    // Agregamos 'relative' y cambiamos la opacidad si está inactiva para dar feedback visual
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 group ${acc.active ? 'border-slate-200' : 'border-slate-200/60 opacity-80'}`}>
      {/* Card Header */}
      <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
        {/* IZQUIERDA: Info de la cuenta */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`flex items-center gap-1 font-bold text-xs uppercase tracking-wide px-2 py-0.5 rounded-md ${acc.active ? 'text-blue-700 bg-blue-100' : 'text-slate-500 bg-slate-200'}`}>
              <Server size={10} />
              {acc.prop_firm}
            </span>
            <span className="text-xs text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded bg-white">
              {acc.account_type}
            </span>
            {!acc.active && (
               <span className="text-[10px] font-bold uppercase text-slate-400 ml-1">Inactiva</span>
            )}
          </div>
          <h3 className="font-semibold text-slate-800 text-lg">{acc.alias}</h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
            ID: {acc.login_id}
          </p>
        </div>

        {/* DERECHA: Estado y Acciones */}
        <div className="flex items-start gap-3">
            {/* Indicador de estado (Punto) */}
            <div 
                className={`w-3 h-3 rounded-full shadow-sm ring-2 ring-white mt-1 ${acc.active ? 'bg-emerald-500' : 'bg-red-500'}`} 
                title={acc.active ? 'Activa' : 'Inactiva'}
            ></div>

            {/* Botones de Acción (NUEVOS) */}
            {/* Usamos -mt-1 para alinearlos perfectamente con el borde superior */}
            <div className="flex items-center gap-0.5 -mt-1 -mr-2 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => onEdit(acc)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                    title="Editar Cuenta"
                >
                    <Edit size={16} />
                </button>
                <button 
                    onClick={() => onDelete(acc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                    title="Eliminar Cuenta"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* Card Body (SIN CAMBIOS) */}
      <div className="p-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Balance Actual</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
                ${acc.balance.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
             <p className="text-xs text-slate-400 mb-1">Inicial</p>
             <p className="text-sm font-medium text-slate-600">
                ${acc.initial_balance.toLocaleString()}
             </p>
          </div>
        </div>

        <div className={`flex justify-between items-center p-4 rounded-lg ${isPositive ? 'bg-emerald-50/50' : 'bg-red-50/50'}`}>
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
               Total P&L
            </p>
            <p className={`font-bold text-lg flex items-center gap-1 ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
              {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {isPositive ? '+' : ''}{calculatedPL.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium mb-1">Crecimiento</p>
            <p className={`text-lg font-bold ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
              {isPositive ? '+' : ''}{calculatedPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-5 flex justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
            <span className="flex items-center gap-1">
                <ShieldAlert size={12} /> Riesgo: {acc.risk_per_trade}%
            </span>
            <span className="flex items-center gap-1">
                <Target size={12} /> Obj: {acc.target_percent}%
            </span>
        </div>
      </div>
    </div>
  );
}