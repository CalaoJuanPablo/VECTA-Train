'use client';

import {
  Button,
  DateField,
  EmailField,
  PasswordField,
  TextField,
  TextLink,
} from '@vecta/design-system';
import { useForm } from '@/forms/use-form';
import { useAuthUIStore } from './auth-ui-store';
import { signInSchema, signUpSchema, type SignInValues, type SignUpValues } from './schemas';
import s from './login.module.css';

export function LoginForm() {
  const mode = useAuthUIStore((state) => state.mode);
  const toggleMode = useAuthUIStore((state) => state.toggleMode);

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

  const onSignIn = (values: SignInValues) => {
    // TODO: wire auth API once the backend sign-in endpoint exists (Phase 1 has none).
    console.info('sign in', values);
  };

  const onSignUp = (values: SignUpValues) => {
    // TODO: wire auth API once the backend sign-up endpoint exists (Phase 1 has none).
    console.info('sign up', values);
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
