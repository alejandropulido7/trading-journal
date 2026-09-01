import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdvancedStats from '@/app/(dashboard)/components/AdvancedStats';

describe('AdvancedStats Component', () => {
  it('renders all stat cards with provided data', () => {
    const mockData = {
      best_trade: 2500,
      worst_trade: -600,
      average_win: 1200,
      average_loss: -400,
      highest_profitable_day: 3500,
      total_trades_count: 24,
      profit_factor: 2.5,
      average_rrr: 3.0,
      sharpe_ratio: 1.85,
      z_score: 1.2,
    };

    render(<AdvancedStats data={mockData} />);

    expect(screen.getByText('Best Trade')).toBeInTheDocument();
    expect(screen.getByText('$2,500')).toBeInTheDocument();

    expect(screen.getByText('Worst Trade')).toBeInTheDocument();
    expect(screen.getByText('$-600')).toBeInTheDocument();

    expect(screen.getByText('Average Win')).toBeInTheDocument();
    expect(screen.getByText('$1,200')).toBeInTheDocument();

    expect(screen.getByText('Average Loss')).toBeInTheDocument();
    expect(screen.getByText('$-400')).toBeInTheDocument();

    expect(screen.getByText('Highest Profitable Day')).toBeInTheDocument();
    expect(screen.getByText('$3,500')).toBeInTheDocument();

    expect(screen.getByText('Total Trades')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();

    expect(screen.getByText('Profit Factor')).toBeInTheDocument();
    expect(screen.getByText('2.5')).toBeInTheDocument();

    expect(screen.getByText('Average RRR')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
    expect(screen.getByText('1.85')).toBeInTheDocument();

    expect(screen.getByText('Z-Score')).toBeInTheDocument();
    expect(screen.getByText('1.2')).toBeInTheDocument();
  });

  it('handles null data gracefully with zero defaults', () => {
    render(<AdvancedStats data={null} />);

    expect(screen.getByText('Best Trade')).toBeInTheDocument();
    expect(screen.getAllByText('$0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
