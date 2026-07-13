import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
const meMock = vi.fn();
const signOutMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/lib/api-client', () => ({
  ApiError: class ApiError extends Error {
    constructor(
      public readonly status: number,
      message: string,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
  apiClient: {
    auth: {
      me: (...args: unknown[]) => meMock(...args),
      signOut: (...args: unknown[]) => signOutMock(...args),
    },
  },
}));

const athleteFixture = {
  id: 'athlete-1',
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  birthDate: '1990-05-01',
};

beforeEach(() => {
  replace.mockReset();
  meMock.mockReset();
  signOutMock.mockReset();
});

describe('DashboardPage', () => {
  it('redirects to /login when the session is missing (401)', async () => {
    const { ApiError } = await import('@/lib/api-client');
    meMock.mockRejectedValueOnce(new ApiError(401, 'Unauthorized'));
    const { default: DashboardPage } = await import('./page');
    render(<DashboardPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/login');
    });
  });

  it('shows an error card when the session check fails for a non-401 reason', async () => {
    meMock.mockRejectedValue(new Error('network down'));
    const { default: DashboardPage } = await import('./page');
    render(<DashboardPage />);

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('renders the athlete greeting when authenticated', async () => {
    meMock.mockResolvedValue({ athlete: athleteFixture });
    const { default: DashboardPage } = await import('./page');
    render(<DashboardPage />);

    expect(await screen.findByText(/Hello, Jane/)).toBeInTheDocument();
    expect(screen.getByText(/jane@example\.com/)).toBeInTheDocument();
  });

  it('signs out and redirects to /login when the user clicks Sign out', async () => {
    const user = userEvent.setup();
    meMock.mockResolvedValue({ athlete: athleteFixture });
    signOutMock.mockResolvedValue(undefined);
    const { default: DashboardPage } = await import('./page');
    render(<DashboardPage />);

    await user.click(await screen.findByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalled();
    });
    expect(replace).toHaveBeenCalledWith('/login');
  });
});