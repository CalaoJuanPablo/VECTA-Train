import { FormsProvider } from '@/forms/forms-provider';
import { LoginForm } from './login-form';
import s from './login.module.css';

export const metadata = { title: 'Sign in — VECTA Train' };

export default function LoginPage() {
  return (
    <main className={s.page}>
      <section className={s.card}>
        <FormsProvider>
          <LoginForm />
        </FormsProvider>
      </section>
    </main>
  );
}
