import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormsProvider } from '@/forms/forms-provider';
import { ApiError, apiClient } from '@/lib/api-client';
import { useAuthUIStore } from './auth-ui-store';
import { LoginForm } from './login-form';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiClient: { ...actual.apiClient, auth: { ...actual.apiClient.auth } } };
});

function renderForm() {
  return render(
    <FormsProvider>
      <LoginForm />
    </FormsProvider>,
  );
}

beforeEach(() => {
  useAuthUIStore.setState({ mode: 'signIn' });
  replace.mockReset();
  vi.spyOn(apiClient.auth, 'signIn').mockReset();
  vi.spyOn(apiClient.auth, 'signUp').mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LoginForm', () => {
  it('shows the sign-in fields and forgot-password link by default', () => {
    renderForm();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows zod validation errors when submitting an empty sign-in form', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('reveals sign-up fields when toggling to create account', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByLabelText('First name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last name')).toBeInTheDocument();
    expect(screen.getByLabelText('Birth date')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toHaveAttribute('type', 'submit');
  });

  it('validates the birth date on sign-up submit', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await user.type(screen.getByLabelText('First name'), 'Jane');
    await user.type(screen.getByLabelText('Last name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'password1');
    // Leave birth date empty.
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Birth date is required')).toBeInTheDocument();
  });

  describe('sign-in submission', () => {
    it('calls the api and navigates to /dashboard on success', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.auth.signIn).mockResolvedValueOnce({
        athlete: {
          id: 'user-1',
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          birthDate: '1990-05-01',
        },
      });
      renderForm();

      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await user.type(screen.getByLabelText('Password'), 'password1');
      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(apiClient.auth.signIn).toHaveBeenCalledWith({
          email: 'jane@example.com',
          password: 'password1',
        });
      });
      expect(replace).toHaveBeenCalledWith('/dashboard');
    });

    it('shows a generic error and does not navigate on 401', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.auth.signIn).mockRejectedValueOnce(
        new ApiError(401, 'Invalid email or password'),
      );
      renderForm();

      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await user.type(screen.getByLabelText('Password'), 'wrongpass1');
      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
      expect(replace).not.toHaveBeenCalled();
    });
  });

  describe('sign-up submission', () => {
    async function fillSignUpForm(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole('button', { name: 'Create account' }));
      await user.type(screen.getByLabelText('First name'), 'Jane');
      await user.type(screen.getByLabelText('Last name'), 'Doe');
      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await user.type(screen.getByLabelText('Password'), 'password1');
      await user.type(screen.getByLabelText('Birth date'), '1990-05-01');
    }

    it('calls the api and navigates to /dashboard on success', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.auth.signUp).mockResolvedValueOnce({
        athlete: {
          id: 'user-1',
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          birthDate: '1990-05-01',
        },
      });
      renderForm();

      await fillSignUpForm(user);
      await user.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => {
        expect(apiClient.auth.signUp).toHaveBeenCalledWith({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'password1',
          birthDate: '1990-05-01',
        });
      });
      expect(replace).toHaveBeenCalledWith('/dashboard');
    });

    it('shows a friendly message when the email is already registered', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.auth.signUp).mockRejectedValueOnce(
        new ApiError(409, 'Email already registered'),
      );
      renderForm();

      await fillSignUpForm(user);
      await user.click(screen.getByRole('button', { name: 'Create account' }));

      expect(await screen.findByText('An account with that email already exists.')).toBeInTheDocument();
      expect(replace).not.toHaveBeenCalled();
    });
  });

  describe('mode toggle', () => {
    it('clears the submit error when toggling from sign-up to sign-in', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.auth.signUp).mockRejectedValueOnce(
        new ApiError(409, 'Email already registered'),
      );
      renderForm();
      // Fill the sign-up form inline (fillSignUpForm is local to the
      // sign-up submission describe block above).
      await user.click(screen.getByRole('button', { name: 'Create account' }));
      await user.type(screen.getByLabelText('First name'), 'Jane');
      await user.type(screen.getByLabelText('Last name'), 'Doe');
      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await user.type(screen.getByLabelText('Password'), 'password1');
      await user.type(screen.getByLabelText('Birth date'), '1990-05-01');
      await user.click(screen.getByRole('button', { name: 'Create account' }));
      expect(
        await screen.findByText('An account with that email already exists.'),
      ).toBeInTheDocument();

      // Toggle back to sign-in — the 409 message MUST NOT persist.
      await user.click(screen.getByRole('button', { name: 'Sign in' }));
      expect(
        screen.queryByText('An account with that email already exists.'),
      ).not.toBeInTheDocument();
    });

    it('clears sign-in field errors when toggling to sign-up', async () => {
      const user = userEvent.setup();
      renderForm();
      // Submit empty sign-in form to surface zod field errors.
      await user.click(screen.getByRole('button', { name: 'Sign in' }));
      expect(
        await screen.findByText('Enter a valid email address'),
      ).toBeInTheDocument();

      // Toggle to sign-up — the sign-in field errors MUST NOT persist.
      await user.click(screen.getByRole('button', { name: 'Create account' }));
      expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();
    });

    it('preserves field values when toggling modes', async () => {
      const user = userEvent.setup();
      renderForm();
      // Type a partial sign-up form, toggle to sign-in, toggle back.
      await user.click(screen.getByRole('button', { name: 'Create account' }));
      await user.type(screen.getByLabelText('First name'), 'Jane');
      await user.click(screen.getByRole('button', { name: 'Sign in' }));
      await user.click(screen.getByRole('button', { name: 'Create account' }));
      // The first name typed before toggling should still be there.
      expect(screen.getByLabelText('First name')).toHaveValue('Jane');
    });
  });
});