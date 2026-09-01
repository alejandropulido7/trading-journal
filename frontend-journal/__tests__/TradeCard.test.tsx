import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TradeCard from '@/app/(dashboard)/trades/TradeCard';
import { Trade } from '@/app/(dashboard)/trades/types';

describe('TradeCard Component', () => {
  const mockWinningTrade: Trade = {
    id: 1,
    ticket: 1234567,
    account_id: 1,
    account_alias: 'FTMO Main',
    symbol: 'NAS100',
    type: 'BUY',
    open_time: '2026-02-15T09:30:00Z',
    close_time: '2026-02-15T10:15:00Z',
    profit: 750.0,
    commission: -10.0,
    swap: 0.0,
    strategy: { id: 1, name: 'SMC Sweep', user_id: 1, items: [] },
    emotion: { id: 1, name: 'Confident' },
    mistake: { id: 1, name: 'None' },
  };

  it('renders winning BUY trade information properly', () => {
    const onEdit = vi.fn();
    render(<TradeCard trade={mockWinningTrade} isWin={true} onEdit={onEdit} />);

    expect(screen.getByText('FTMO Main')).toBeInTheDocument();
    expect(screen.getByText('NAS100')).toBeInTheDocument();
    expect(screen.getByText('WIN')).toBeInTheDocument();
    expect(screen.getByText('BUY')).toBeInTheDocument();
    expect(screen.getByText('+$750.00')).toBeInTheDocument();
    expect(screen.getByText('SMC Sweep')).toBeInTheDocument();
    expect(screen.getByText('Confident')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('renders losing SELL trade with negative formatting', () => {
    const mockLosingTrade: Trade = {
      ...mockWinningTrade,
      id: 2,
      type: 'SELL',
      profit: -350.0,
      strategy: undefined,
      emotion: undefined,
      mistake: undefined,
    };
    const onEdit = vi.fn();
    render(<TradeCard trade={mockLosingTrade} isWin={false} onEdit={onEdit} />);

    expect(screen.getByText('LOSS')).toBeInTheDocument();
    expect(screen.getByText('SELL')).toBeInTheDocument();
    expect(screen.getByText('-$350.00')).toBeInTheDocument();
  });

  it('calls onEdit when the analyze button is clicked', () => {
    const onEdit = vi.fn();
    render(<TradeCard trade={mockWinningTrade} isWin={true} onEdit={onEdit} />);

    const editBtn = screen.getByTitle('Analizar Trade');
    fireEvent.click(editBtn);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(mockWinningTrade);
  });

  it('opens details dialog when clicking Ver Detalles', () => {
    const onEdit = vi.fn();
    render(<TradeCard trade={mockWinningTrade} isWin={true} onEdit={onEdit} />);

    const detailsBtn = screen.getByRole('button', { name: /ver detalles/i });
    fireEvent.click(detailsBtn);

    expect(screen.getByText(/Detalles del Trade #1234567/i)).toBeInTheDocument();
    expect(screen.getByText(/Ejecutado en FTMO Main/i)).toBeInTheDocument();
    expect(screen.getByText('-$10.00')).toBeInTheDocument();
  });
});
