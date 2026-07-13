'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import s from './page.module.css';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    apiClient.auth
      .me()
      .then(() => {
        if (cancelled) return;
        router.replace('/dashboard');
      })
      .catch(() => {
        if (cancelled) return;
        router.replace('/login');
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className={s.home}>
      <h1 className={s.title}>VECTA Train</h1>
      <p className={s.subtitle}>Checking your session…</p>
    </main>
  );
}