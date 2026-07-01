import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { FormsProvider } from '@/forms/forms-provider';
import { useAuthUIStore } from './auth-ui-store';
import { LoginForm } from './login-form';

function renderForm() {
  return render(
    <FormsProvider>
      <LoginForm />
    </FormsProvider>,
  );
}

beforeEach(() => {
  // Reset the global UI store between tests.
  useAuthUIStore.setState({ mode: 'signIn' });
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
});
