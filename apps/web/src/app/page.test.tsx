import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
const meMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    auth: {
      me: (...args: unknown[]) => meMock(...args),
    },
  },
}));

beforeEach(() => {
  replace.mockReset();
  meMock.mockReset();
  // Default: a never-resolving promise — keeps the effect from racing the
  // assertion when a test only checks the static render.
  meMock.mockReturnValue(new Promise(() => {}));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Home (/)', () => {
  it('renders the VECTA Train title on mount', async () => {
    const { default: Home } = await import('./page');
    render(<Home />);
    expect(screen.getByText('VECTA Train')).toBeInTheDocument();
  });

  it('renders the "Checking your session…" subtitle while the check is in flight', async () => {
    // Promise never resolves during the render — we only verify the static text.
    meMock.mockReturnValueOnce(new Promise(() => {}));
    const { default: Home } = await import('./page');
    render(<Home />);
    expect(screen.getByText(/Checking your session/)).toBeInTheDocument();
  });

  it('redirects to /dashboard when /auth/me resolves', async () => {
    meMock.mockResolvedValueOnce({
      athlete: { id: 'athlete-1', email: 'jane@example.com', firstName: 'Jane', lastName: 'Doe', birthDate: '1990-05-01' },
    });
    const { default: Home } = await import('./page');
    render(<Home />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('redirects to /login when /auth/me rejects with 401', async () => {
    meMock.mockRejectedValueOnce(new Error('Unauthorized'));
    const { default: Home } = await import('./page');
    render(<Home />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects to /login on a generic network error', async () => {
    meMock.mockRejectedValueOnce(new Error('network down'));
    const { default: Home } = await import('./page');
    render(<Home />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/login');
    });
  });
});