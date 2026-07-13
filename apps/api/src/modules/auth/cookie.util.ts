import type { Response } from 'express';

export const SESSION_COOKIE_NAME = 'vt_sid';

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export interface CookieConfig {
  secure: boolean;
}

/**
 * Reads cookie config from env. `Secure` is on whenever explicitly true (production
 * or HTTPS), off in local dev so the cookie works over http://localhost.
 */
export function readCookieConfig(): CookieConfig {
  return { secure: process.env.COOKIE_SECURE === 'true' };
}

export function setSessionCookie(res: Response, sessionId: string, config: CookieConfig): void {
  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secure,
    path: '/',
    maxAge: THIRTY_DAYS_SECONDS * 1000,
  });
}

export function clearSessionCookie(res: Response, config: CookieConfig): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secure,
    path: '/',
  });
}