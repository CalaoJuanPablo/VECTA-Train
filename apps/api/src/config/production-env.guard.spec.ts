import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { assertProductionEnv } from './production-env.guard';

const ORIGINAL_ENV = { ...process.env };

function setProduction(overrides: Record<string, string | undefined>): void {
  process.env = { ...ORIGINAL_ENV, NODE_ENV: 'production', ...overrides };
}

function clearProductionEnv(): void {
  process.env = { ...ORIGINAL_ENV };
}

beforeEach(() => {
  clearProductionEnv();
});

afterEach(() => {
  clearProductionEnv();
});

describe('assertProductionEnv', () => {
  it('is a no-op when NODE_ENV is unset (defaults to development)', () => {
    expect(() => assertProductionEnv()).not.toThrow();
  });

  it('is a no-op when NODE_ENV=test', () => {
    process.env.NODE_ENV = 'test';
    expect(() => assertProductionEnv()).not.toThrow();
  });

  it('throws when NODE_ENV=production and DATABASE_URL is missing', () => {
    setProduction({ DATABASE_URL: undefined, WEB_ORIGIN: 'https://app.example.com', COOKIE_SECURE: 'true' });
    expect(() => assertProductionEnv()).toThrow(/DATABASE_URL/);
  });

  it('throws when NODE_ENV=production and WEB_ORIGIN is missing', () => {
    setProduction({ DATABASE_URL: 'postgres://x', WEB_ORIGIN: undefined, COOKIE_SECURE: 'true' });
    expect(() => assertProductionEnv()).toThrow(/WEB_ORIGIN/);
  });

  it('throws when NODE_ENV=production and COOKIE_SECURE is not "true"', () => {
    setProduction({ DATABASE_URL: 'postgres://x', WEB_ORIGIN: 'https://app.example.com', COOKIE_SECURE: 'false' });
    expect(() => assertProductionEnv()).toThrow(/COOKIE_SECURE=true/);
  });

  it('throws when NODE_ENV=production and COOKIE_SECURE is unset', () => {
    setProduction({ DATABASE_URL: 'postgres://x', WEB_ORIGIN: 'https://app.example.com', COOKIE_SECURE: undefined });
    expect(() => assertProductionEnv()).toThrow(/COOKIE_SECURE=true/);
  });

  it('lists every missing var in a single error', () => {
    setProduction({ DATABASE_URL: undefined, WEB_ORIGIN: undefined, COOKIE_SECURE: undefined });
    expect(() => assertProductionEnv()).toThrow(
      /DATABASE_URL.*WEB_ORIGIN.*COOKIE_SECURE=true/,
    );
  });

  it('passes when all required production env vars are present', () => {
    setProduction({
      DATABASE_URL: 'postgres://x',
      WEB_ORIGIN: 'https://app.example.com',
      COOKIE_SECURE: 'true',
    });
    expect(() => assertProductionEnv()).not.toThrow();
  });
});