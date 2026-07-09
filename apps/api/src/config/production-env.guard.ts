/**
 * Required environment variables that must be set when NODE_ENV=production.
 * Listed here so the boot-time assertion and its tests share a single source.
 */
const PRODUCTION_REQUIRED_ENV = [
  'DATABASE_URL',
  'WEB_ORIGIN',
  'COOKIE_SECURE',
] as const;

function readNodeEnv(): 'development' | 'production' | 'test' {
  const raw = process.env.NODE_ENV ?? 'development';
  if (raw === 'production' || raw === 'test') return raw;
  return 'development';
}

/**
 * Throws if any production-required env var is missing or, in the case of
 * COOKIE_SECURE, not explicitly set to "true". Refuses to boot with a
 * configuration that would silently leak cross-origin cookies over HTTP.
 */
export function assertProductionEnv(nodeEnv = readNodeEnv()): void {
  if (nodeEnv !== 'production') return;

  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
  if (!process.env.WEB_ORIGIN) missing.push('WEB_ORIGIN');
  if (process.env.COOKIE_SECURE !== 'true') missing.push('COOKIE_SECURE=true');

  if (missing.length > 0) {
    throw new Error(
      `Refusing to start: missing required production env vars: ${missing.join(', ')}. ` +
        `See apps/api/.env.example for the full list.`,
    );
  }
}

export const __testing__ = { readNodeEnv, PRODUCTION_REQUIRED_ENV };