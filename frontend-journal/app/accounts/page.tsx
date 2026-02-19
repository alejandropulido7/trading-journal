"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity } from 'lucide-react';

// Tipos
import { Account, AccountCreate, Server } from './types';

// Componentes
import Header from './components/Header';
import GridCards from './components/GridCards';
import CreateModal from './components/CreateModal';
import EditModal from './components/EditModal';

// Servidores soportados (Hardcoded por ahora)
const SUPPORTED_SERVERS = [
  "FundedNext-Server",
  "FundedNext-Demo",
  "MetaQuotes-Demo",
  "FTMO-Server",
  "FundingPips-Server",
  "SureLeverageFunding-Server"
];

export default function AccountsPage() {
  // --- ESTADOS ---
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableServers, setAvailableServers] = useState<Server[]>([]);

  const [filter, setFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [newAcc, setNewAcc] = useState<AccountCreate>({
    login_id: '', password: '', server: '', alias: '', prop_firm: '',
    account_type: 'Phase 1', initial_balance: '', risk_per_trade: '1.0', target_percent: '8.0', investment: '',
    trailing_drawdown: false, daily_drawdown_limit: '', max_drawdown_limit: '', consistency_rule: ''
  });

  const API_URL = 'http://localhost:8000';

  // --- LOGICA ---
  const fetchAccounts = async () => {
    try {
      const res = await axios.get<Account[]>(`${API_URL}/accounts/`);
      setAccounts(res.data);
    } catch (error) { console.error("Error fetching accounts", error); }
  };

  useEffect(() => {
      // Cargar cuentas...
      fetchAccounts();

      // CARGAR SERVIDORES DE LA DB
      axios.get(`${API_URL}/servers/`).then(res => {
          setAvailableServers(res.data);
      });
  }, []);

  // 1. Eliminar Cuenta
  const handleDelete = async (id: number) => {
    if(!confirm("¿Estás seguro de ELIMINAR esta cuenta? Se perderá todo el historial.")) return;
    try {
        await axios.delete(`${API_URL}/accounts/${id}`);
        fetchAccounts(); // Recargar
    } catch (error) { alert("Error eliminando cuenta"); }
  };


  // 2. Abrir Modal Edición
  const openEditModal = (acc: Account) => {
      setEditingAccount(acc);
      setIsEditOpen(true);
  };

  // 3. Guardar Edición
  const handleUpdate = async (id: number, alias: string, active: boolean) => {
      try {
          await axios.patch(`${API_URL}/accounts/${id}`, { alias, active });
          setIsEditOpen(false);
          fetchAccounts();
      } catch (error) { alert("Error actualizando cuenta"); }
  }

  const handleSync = async () => {
    setLoading(true);
    setSyncMsg('Contactando VPS...');
    try {
      const res = await axios.post(`${API_URL}/sync-all`);
      setSyncMsg(`✅ Éxito: ${res.data.new_trades_added} trades nuevos.`);
      fetchAccounts();
    } catch (error) {
      setSyncMsg('❌ Error de conexión.');
      console.error(error);
    }
    setLoading(false);
  };

  const registerAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/accounts/`, newAcc);
      setNewAcc({ login_id: '', password: '', server: '', alias: '', prop_firm: '', account_type: 'Phase 1', initial_balance: '', risk_per_trade: '1.0', target_percent: '8.0', investment: '' ,
        trailing_drawdown: false, daily_drawdown_limit: '6.0', max_drawdown_limit: '3.0', consistency_rule: '25.0'
      });
      setIsModalOpen(false);
      fetchAccounts();
    } catch (error) { alert("Error al crear cuenta"); }
  };

  const filteredAccounts = accounts.filter(acc => {
      if (filter === 'active') return acc.active;
      if (filter === 'inactive') return !acc.active;
      return true; // 'all'
  });

  // --- RENDER ---
  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* 1. Header Component */}
        <Header 
            onSync={handleSync} 
            onOpenModal={() => setIsModalOpen(true)} 
            loading={loading}
            filter={filter}      // <--- Prop
            setFilter={setFilter} // <--- Prop
        />
        
        {/* 2. Mensaje de Estado */}
        {syncMsg && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${syncMsg.includes('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            <Activity size={20} />
            <span className="font-medium text-sm">{syncMsg}</span>
          </div>
        )}

        {/* 3. Grid Component */}
        <GridCards 
            accounts={filteredAccounts} // <--- Pasamos la lista filtrada
            onEdit={openEditModal}
            onDelete={handleDelete}
        />

        {/* 4. Modal Component */}
        <CreateModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            onSubmit={registerAccount}
            newAcc={newAcc}
            setNewAcc={setNewAcc}
            servers={availableServers}
        />

        <EditModal 
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onSubmit={handleUpdate}
            account={editingAccount}
        />
        
      </div>
    </main>
  );
}