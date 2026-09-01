import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RiskStatusCard from '@/app/(dashboard)/components/RiskStatusCard';

describe('RiskStatusCard Component', () => {
  const mockMetricTrailing = {
    account_alias: 'Apex Trailing 50k',
    current_balance: 52000,
    drawdown_limit_price: 49500,
    drawdown_progress: 20.0,
    is_trailing: true,
    max_drawdown_percent: 5.0,
    consistency_rule_percent: 30.0,
    consistency_progress: 50.0,
    highest_daily_profit: 1500,
    profit_target_for_consistency: 5000,
    is_in_drawdown: false,
  };

  it('renders trailing drawdown information correctly', () => {
    render(<RiskStatusCard metric={mockMetricTrailing} />);

    expect(screen.getByText('Apex Trailing 50k')).toBeInTheDocument();
    expect(screen.getByText('Bal: $52,000')).toBeInTheDocument();
    expect(screen.getByText(/Drawdown \(Trailing\)/i)).toBeInTheDocument();
    expect(screen.getByText('20.0% Usado')).toBeInTheDocument();
    expect(screen.getByText('Hard Stop: $49,500')).toBeInTheDocument();
    expect(screen.getByText('Max: 5%')).toBeInTheDocument();
    expect(screen.getByText(/Regla Consistencia \(30%\)/i)).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
    expect(screen.getByText('Mejor Día: $1,500')).toBeInTheDocument();
    expect(screen.getByText('Objetivo: $5,000')).toBeInTheDocument();
  });

  it('renders static drawdown and drawdown state for consistency', () => {
    const mockMetricStaticInDD = {
      ...mockMetricTrailing,
      account_alias: 'FTMO Static 100k',
      is_trailing: false,
      is_in_drawdown: true,
      current_balance: 98000,
      drawdown_progress: 40.0,
    };

    render(<RiskStatusCard metric={mockMetricStaticInDD} />);

    expect(screen.getByText('FTMO Static 100k')).toBeInTheDocument();
    expect(screen.getByText(/Drawdown \(Static\)/i)).toBeInTheDocument();
    expect(screen.getByText('40.0% Usado')).toBeInTheDocument();
    expect(screen.getByText('En Drawdown')).toBeInTheDocument();
  });

  it('renders "Sin regla de consistencia activa" when consistency rule is 0', () => {
    const mockMetricNoConsistency = {
      ...mockMetricTrailing,
      consistency_rule_percent: 0,
    };

    render(<RiskStatusCard metric={mockMetricNoConsistency} />);
    expect(screen.getByText('Sin regla de consistencia activa')).toBeInTheDocument();
  });
});
