// app/accounts/components/GridCards.tsx
import { Wallet } from 'lucide-react';
import { Account } from '../types';
import AccountCard from './AccountCard';

interface GridCardsProps {
  accounts: Account[];
  onEdit: (acc: Account) => void; // <--- Nuevo
  onDelete: (id: number) => void; // <--- Nuevo
}

export default function GridCards({ accounts, onEdit, onDelete }: GridCardsProps) {
  if (accounts.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-xl border border-dashed border-slate-300">
        {/* ... mensaje vacío ... */}
        <p className="text-slate-500 font-medium">No hay cuentas en esta vista.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map((acc) => (
        <AccountCard 
            key={acc.id} 
            acc={acc} 
            onEdit={onEdit}     // <--- Pasar prop
            onDelete={onDelete} // <--- Pasar prop
        />
      ))}
    </div>
  );
}