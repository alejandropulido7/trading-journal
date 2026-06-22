// app/accounts/components/Header.tsx
import { Wallet, RefreshCw, PlusCircle, Filter } from 'lucide-react';

interface HeaderProps {
  onSync: () => void;
  onOpenModal: () => void;
  loading: boolean;
  filter: 'active' | 'inactive' | 'all'; // <--- Nuevo Prop
  setFilter: (f: 'active' | 'inactive' | 'all') => void; // <--- Nuevo Prop
}

export default function Header({ onSync, onOpenModal, loading, filter, setFilter }: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Wallet className="w-8 h-8 text-blue-600" />
          Trading Accounts
        </h1>
        <p className="text-sm text-slate-500 mt-1">Gestión de capital y estado de cuentas</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        
        {/* FILTRO DE ESTADO */}
        <div className="bg-white border border-slate-200 p-1 rounded-lg flex items-center shadow-sm">
            <button 
                onClick={() => setFilter('active')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${filter === 'active' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                Activas
            </button>
            <button 
                onClick={() => setFilter('inactive')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${filter === 'inactive' ? 'bg-slate-200 text-slate-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                Inactivas
            </button>
            <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                Todas
            </button>
        </div>

        <div className="h-6 w-px bg-slate-300 mx-1 hidden md:block"></div>

        <button 
          onClick={onSync}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm text-white font-medium transition ${loading ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span className="hidden md:inline">{loading ? 'Sync...' : 'Sincronizar'}</span>
        </button>
        <button 
          onClick={onOpenModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >
          <PlusCircle size={18} />
          <span className="hidden md:inline">Nueva</span>
        </button>
      </div>
    </div>
  );
}