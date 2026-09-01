import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LogoutButton from '@/app/(dashboard)/components/Logout';
import Cookies from 'js-cookie';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe('LogoutButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with Cerrar Sesión text', () => {
    render(<LogoutButton />);
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  it('removes token cookie, redirects to /login and refreshes router on click', () => {
    const removeCookieSpy = vi.spyOn(Cookies, 'remove');
    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /cerrar sesión/i });
    fireEvent.click(button);

    expect(removeCookieSpy).toHaveBeenCalledWith('token');
    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(mockRefresh).toHaveBeenCalled();
  });
});
