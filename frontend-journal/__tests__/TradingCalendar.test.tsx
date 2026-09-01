import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TradingCalendar from '@/app/(dashboard)/components/TradingCalendar';
import api from '@/app/lib/api';

vi.mock('@/app/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('TradingCalendar Component', () => {
  const mockCalendarData = {
    month_total_profit: 3450,
    month_win_rate: 68.5,
    total_trades: 12,
    days: [
      { date: '2026-02-05', profit: 1200, trades_count: 3, wins: 2 },
      { date: '2026-02-10', profit: -400, trades_count: 1, wins: 0 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches calendar data on mount and displays metrics', async () => {
    (api.get as any).mockResolvedValueOnce({ data: mockCalendarData });

    render(<TradingCalendar selectedAccountId="" />);

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/trades/calendar-stats?year='));

    await waitFor(() => {
      expect(screen.getByText('$3,450')).toBeInTheDocument();
      expect(screen.getByText('68.5%')).toBeInTheDocument();
      expect(screen.getByText('Dom')).toBeInTheDocument();
      expect(screen.getByText('Lun')).toBeInTheDocument();
    });
  });

  it('passes selectedAccountId in the API request query param', async () => {
    (api.get as any).mockResolvedValueOnce({ data: mockCalendarData });

    render(<TradingCalendar selectedAccountId={5} />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('&account_id=5'));
    });
  });

  it('triggers next and previous month navigation', async () => {
    (api.get as any).mockResolvedValue({ data: mockCalendarData });

    render(<TradingCalendar selectedAccountId="" />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    // Find and click next month button
    const buttons = screen.getAllByRole('button');
    const prevBtn = buttons[0];
    const nextBtn = buttons[1];

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(3);
    });
  });
});
