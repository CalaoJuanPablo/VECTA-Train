/**
 * Auth input/output shapes shared between `apps/api` and `apps/web`. Server
 * validation is independent from the web app's zod schemas — the wire format
 * stays in sync via this module.
 */

export interface Athlete {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** ISO-8601 date (YYYY-MM-DD). */
  birthDate: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  /** ISO-8601 date (YYYY-MM-DD). */
  birthDate: string;
}

export interface AuthResponse {
  athlete: Athlete;
}