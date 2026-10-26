/**
 * Applies the theme before first paint so there is no flash of the wrong one.
 * Theme switching is deliberately not React state: it is a `data-theme`
 * attribute on `<html>`, mirrored to `localStorage` and overridden by the OS
 * preference (spec-4 § 1).
 */

const STORAGE_KEY = 'vt-theme';

export type ColorScheme = 'light' | 'dark';

export function prefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(scheme: ColorScheme): void {
  const root = document.documentElement;
  root.dataset.theme = scheme;
  root.dataset.colorScheme = scheme;
}

/** Runs synchronously in `<head>`, before the app bundle. */
export function runThemeScript(): void {
  const stored = safeReadStored();
  const scheme: ColorScheme = stored ?? (prefersDark() ? 'dark' : 'light');
  applyTheme(scheme);
}

function safeReadStored(): ColorScheme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

runThemeScript();
