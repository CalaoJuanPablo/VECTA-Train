'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@vecta/design-system';
import { ApiError, apiClient } from '@/lib/api-client';
import type { Athlete } from '@vecta/shared-types';
import s from './dashboard.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    apiClient.auth
      .me()
      .then(({ athlete: me }) => {
        if (cancelled) return;
        setAthlete(me);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace('/login');
          return;
        }
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const onSignOut = async () => {
    try {
      await apiClient.auth.signOut();
    } finally {
      router.replace('/login');
    }
  };

  if (status === 'loading') {
    return (
      <main className={s.page}>
        <section className={s.card}>
          <p className={s.status}>Loading…</p>
        </section>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className={s.page}>
        <section className={s.card}>
          <header className={s.header}>
            <p className={s.eyebrow}>Dashboard</p>
            <h1 className={s.title}>Something went wrong</h1>
          </header>
          <p className={s.body}>We couldn’t verify your session. Please try again.</p>
          <div className={s.actions}>
            <Button onClick={() => router.replace('/login')}>Back to sign in</Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={s.page}>
      <section className={s.card}>
        <header className={s.header}>
          <p className={s.eyebrow}>Dashboard</p>
          <h1 className={s.title}>
            Hello, {athlete!.firstName}
          </h1>
        </header>
        <p className={s.body}>
          You’re signed in as {athlete!.email}. Activities, training load, and insights will land
          here as Phase 1 ships.
        </p>
        <div className={s.actions}>
          <Button variant="secondary" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </section>
    </main>
  );
}