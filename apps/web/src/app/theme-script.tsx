'use client';

import { useEffect } from 'react';

export default function ThemeScript() {
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const theme = mql.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-color-scheme', theme);

    const handler = (e: MediaQueryListEvent) => {
      const t = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', t);
      document.documentElement.setAttribute('data-color-scheme', t);
    };

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return null;
}
