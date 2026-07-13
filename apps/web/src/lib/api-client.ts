import type {
  Athlete,
  SignInInput,
  SignUpInput,
} from '@vecta/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Low-level fetch wrapper. Always sends credentials so the api's session cookie
 * round-trips cross-origin (Vercel web ↔ Render api).
 */
async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const init: RequestInit = {
    method: opts.method ?? 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal: opts.signal,
  };
  if (opts.body !== undefined) {
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
    init.body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_URL}${path}`, init);

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const parsed: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    let message: string;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'message' in parsed &&
      typeof (parsed as { message?: unknown }).message === 'string'
    ) {
      message = (parsed as { message: string }).message;
    } else {
      message = `Request failed (${res.status})`;
    }
    throw new ApiError(res.status, message, parsed);
  }

  return parsed as T;
}

export const apiClient = {
  getItems: () => request<unknown[]>('/items'),

  auth: {
    signUp: (input: SignUpInput): Promise<{ athlete: Athlete }> =>
      request<{ athlete: Athlete }>('/auth/sign-up', { method: 'POST', body: input }),
    signIn: (input: SignInInput): Promise<{ athlete: Athlete }> =>
      request<{ athlete: Athlete }>('/auth/sign-in', { method: 'POST', body: input }),
    signOut: () => request<void>('/auth/sign-out', { method: 'POST' }),
    me: (): Promise<{ athlete: Athlete }> => request<{ athlete: Athlete }>('/auth/me'),
  },
};