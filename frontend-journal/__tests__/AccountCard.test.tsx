import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AccountCard from '@/app/(dashboard)/accounts/components/AccountCard';
import { Account } from '@/app/(dashboard)/accounts/types';

describe('AccountCard Component', () => {
  const mockAccount: Account = {
    id: 1,
    login_id: 887766,
    password: 'secret',
    server: 'FTMO-Server',
    alias: 'Main Funded 100k',
    prop_firm: 'FTMO',
    account_type: 'Funded',
    initial_balance: 100000,
    balance: 108500,
    risk_per_trade: 1.0,
    target_percent: 10.0,
    investment: 500,
    trailing_drawdown: false,
    daily_drawdown_limit: 5.0,
    max_drawdown_limit: 10.0,
    consistency_rule: 30.0,
    start_date: '2026-01-01',
    active: true,
  };

  it('renders account information properly', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<AccountCard acc={mockAccount} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Main Funded 100k')).toBeInTheDocument();
    expect(screen.getByText(/ID: 887766/i)).toBeInTheDocument();
    expect(screen.getByText('FTMO')).toBeInTheDocument();
    expect(screen.getByText('Funded')).toBeInTheDocument();
    expect(screen.getByText('$108,500')).toBeInTheDocument();
    expect(screen.getByText('$100,000')).toBeInTheDocument();
    expect(screen.getByText(/\+8.50%/)).toBeInTheDocument();
    expect(screen.getByText(/Riesgo: 1%/)).toBeInTheDocument();
    expect(screen.getByText(/Obj: 10%/)).toBeInTheDocument();
  });

  it('calculates negative P&L and growth percentage for losing account', () => {
    const losingAccount: Account = {
      ...mockAccount,
      id: 2,
      balance: 97000,
      active: false,
    };
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<AccountCard acc={losingAccount} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('-$3,000.00')).toBeInTheDocument();
    expect(screen.getByText('-3.00%')).toBeInTheDocument();
    expect(screen.getByText(/Inactiva/i)).toBeInTheDocument();
  });

  it('triggers onEdit callback with account object on edit button click', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<AccountCard acc={mockAccount} onEdit={onEdit} onDelete={onDelete} />);

    const editBtn = screen.getByTitle('Editar Cuenta');
    fireEvent.click(editBtn);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(mockAccount);
  });

  it('triggers onDelete callback with account id on delete button click', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<AccountCard acc={mockAccount} onEdit={onEdit} onDelete={onDelete} />);

    const deleteBtn = screen.getByTitle('Eliminar Cuenta');
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
