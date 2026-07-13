'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Button,
  DateField,
  EmailField,
  PasswordField,
  TextField,
  TextLink,
} from '@vecta/design-system';
import { ApiError, apiClient } from '@/lib/api-client';
import { useForm } from '@/forms/use-form';
import { useAuthUIStore } from './auth-ui-store';
import { signInSchema, signUpSchema, type SignInValues, type SignUpValues } from './schemas';
import s from './login.module.css';

export function LoginForm() {
  const router = useRouter();
  const mode = useAuthUIStore((state) => state.mode);
  const toggleMode = useAuthUIStore((state) => state.toggleMode);

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Two named forms hosted by the same FormsProvider.
  const signIn = useForm({
    id: 'signIn',
    schema: signInSchema,
    initialValues: { email: '', password: '' },
  });

  const signUp = useForm({
    id: 'signUp',
    schema: signUpSchema,
    initialValues: { firstName: '', lastName: '', email: '', password: '', birthDate: '' },
  });

  // Clear all error state when the user toggles between sign-in and sign-up.
  // Values are preserved so a half-typed entry on one mode stays usable
  // if the user toggles back; only the 4xx submit error and per-field zod
  // errors get wiped. signIn / signUp are deliberately omitted from deps
  // — useForm() returns a new object on every render, so depending on
  // them would trigger this effect on each render (infinite loop).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setSubmitError(null);
    signIn.clearErrors();
    signUp.clearErrors();
  }, [mode]);

  const onSignIn = async (values: SignInValues) => {
    setSubmitError(null);
    try {
      await apiClient.auth.signIn(values);
      router.replace('/dashboard');
    } catch (error) {
      setSubmitError(messageFor(error));
    }
  };

  const onSignUp = async (values: SignUpValues) => {
    setSubmitError(null);
    try {
      await apiClient.auth.signUp(values);
      router.replace('/dashboard');
    } catch (error) {
      setSubmitError(messageFor(error));
    }
  };

  return (
    <div className={s.form}>
      <header className={s.header}>
        <h1 className={s.title}>{mode === 'signIn' ? 'Welcome back' : 'Create your account'}</h1>
        <p className={s.subtitle}>
          {mode === 'signIn'
            ? 'Sign in to track your training.'
            : 'Start tracking your training load.'}
        </p>
      </header>

      {mode === 'signIn' ? (
        <form className={s.fields} onSubmit={signIn.handleSubmit(onSignIn)} noValidate>
          <EmailField
            label="Email"
            placeholder="you@example.com"
            required
            {...signIn.fieldProps('email')}
          />
          <PasswordField
            label="Password"
            placeholder="Your password"
            required
            {...signIn.fieldProps('password')}
          />
          <div className={s.forgot}>
            <TextLink href="/forgot-password">Forgot password?</TextLink>
          </div>
          {submitError && (
            <p className={s.error} role="alert">
              {submitError}
            </p>
          )}
          <Button type="submit" fullWidth disabled={signIn.isSubmitting}>
            Sign in
          </Button>
        </form>
      ) : (
        <form className={s.fields} onSubmit={signUp.handleSubmit(onSignUp)} noValidate>
          <div className={s.row}>
            <TextField
              label="First name"
              autoComplete="given-name"
              required
              {...signUp.fieldProps('firstName')}
            />
            <TextField
              label="Last name"
              autoComplete="family-name"
              required
              {...signUp.fieldProps('lastName')}
            />
          </div>
          <EmailField
            label="Email"
            placeholder="you@example.com"
            required
            {...signUp.fieldProps('email')}
          />
          <PasswordField
            label="Password"
            placeholder="Create a password"
            description="At least 8 characters, including a number"
            newPassword
            required
            {...signUp.fieldProps('password')}
          />
          <DateField label="Birth date" required {...signUp.fieldProps('birthDate')} />
          {submitError && (
            <p className={s.error} role="alert">
              {submitError}
            </p>
          )}
          <Button type="submit" fullWidth disabled={signUp.isSubmitting}>
            Create account
          </Button>
        </form>
      )}

      <p className={s.switch}>
        {mode === 'signIn' ? "Don't have an account? " : 'Already registered? '}
        <TextLink as="button" onClick={toggleMode}>
          {mode === 'signIn' ? 'Create account' : 'Sign in'}
        </TextLink>
      </p>
    </div>
  );
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return 'An account with that email already exists.';
    if (error.status === 401) return 'Invalid email or password.';
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}