# VECTA Train — Starter Scaffold

Minimal monorepo skeleton, current stable versions (Jun 2026):
Next.js 16 / React 19, NestJS 11, TypeScript 6, Tailwind 4.

apps/
api/ NestJS backend — one generic "items" CRUD example (in-memory, no DB yet)
web/ Next.js frontend — home page + one generic page calling the API
packages/
shared-types/ shared TS types

## Run

pnpm install
pnpm dev

- api: http://localhost:3001
- web: http://localhost:3000

DB (Postgres/Prisma), auth, and the real domain modules are intentionally
left out — add them once this base is confirmed running.

## Local testing

The `auth/` module supports a full local signup → use → signout round trip
against Postgres + Prisma. Tests below use [Insomnia](https://insomnia.rest)
(any HTTP client works — Postman, Bruno, curl).

### Prerequisites

```bash
pnpm install
cp apps/api/.env.example apps/api/.env       # gitignored, never committed
pnpm --filter @vecta/api db:up               # Postgres on :5433
pnpm --filter @vecta/api prisma:migrate      # apply migrations
pnpm --filter @vecta/api dev                 # api on :3001
```

Wait for `Nest application successfully started` in the api log.

### Smoke check (api is up)

```
GET http://localhost:3001/items
```

Returns `200 []`. The `items` module is a pre-Phase-1 placeholder, but it
doubles as a liveness probe — it confirms Prisma connected.

### Auth round trip

All requests below target `http://localhost:3001`. JSON bodies set
`Content-Type: application/json`. The `vt_sid` cookie is set on sign-up
and sign-in and cleared on sign-out; your HTTP client will send it
automatically on subsequent requests to the same origin.

| # | Endpoint | Method | Body | Expected |
|---|----------|--------|------|----------|
| 1 | `/auth/sign-up` | POST | `{ "firstName": "Jane", "lastName": "Doe", "email": "jane@example.com", "password": "password1", "birthDate": "1990-05-01" }` | `201` + `{ athlete: { ... } }` + `Set-Cookie: vt_sid=...` |
| 2 | `/auth/me` | GET | — | `200` + same `athlete` payload (cookie auto-attached) |
| 3 | `/auth/sign-out` | POST | — | `204` + clearing `Set-Cookie` |
| 4 | `/auth/me` | GET | — | `401` (session row gone) |
| 5 | `/auth/sign-in` | POST | `{ "email": "jane@example.com", "password": "password1" }` | `200` + new cookie + `athlete` |

The cookie is `HttpOnly`, `SameSite=Lax`, `Secure`-when-`COOKIE_SECURE=true`,
`Path=/`, `Max-Age=2592000` (30 days).

### Validation rules enforced by the server

`POST /auth/sign-up`:

- `email` — RFC-email format; trimmed + lowercased
- `password` — 8 to 128 characters (real length check is `argon2.verify`;
  the upper bound is a DoS guard against memory-hard hashing)
- `birthDate` — ISO `YYYY-MM-DD`; must be a past date; implied age 13–120
- `firstName` / `lastName` — 1 to 100 characters; trimmed

`POST /auth/sign-in`:

- `email` — RFC-email format; trimmed + lowercased
- `password` — at most 128 characters (no minimum — the real check is
  the hash compare)

Any field outside these is rejected by the global `ValidationPipe`
(`whitelist: true`, `forbidNonWhitelisted: true`).

### Negative paths

| Test | Expected |
|---|---|
| sign-up with duplicate email | `409` `Email already registered` |
| sign-up with `birthDate` under 13 / over 120 / in the future | `400` |
| sign-up with extra fields (e.g. `role`) | `400` `property role should not exist` |
| sign-in with wrong email | `401` `Invalid email or password` |
| sign-in with wrong password | `401` — same message as above (no user enumeration) |
| `/auth/me` without a cookie | `401` |

### Rate limits (via `@nestjs/throttler`)

| Endpoint | Limit | Window |
|---|---|---|
| `POST /auth/sign-up` | 5 / IP | 1 minute |
| `POST /auth/sign-in` | 10 / IP | 1 minute |
| `POST /auth/sign-out`, `GET /auth/me` | inherit module default (10 / IP) | 1 minute |

Trip the limit: send 6 sign-ups (or 11 sign-ins) for the same IP within
60 s and observe the next response as `429 Too Many Requests`.

### Timing-safe signIn (security)

The response latency for "unknown email" vs "wrong password" should be
within ~10 ms of each other. A wider spread means the user-enumeration
oracle has regressed. The `PasswordService.getDummyHash()` mechanism runs
`argon2.verify` against a pre-computed hash even when no athlete row
exists; do not "simplify" this in a refactor without thinking through the
timing implications.

### Production-env guard

Confirm the boot-time fail-fast works:

```bash
NODE_ENV=production \
DATABASE_URL= WEB_ORIGIN= COOKIE_SECURE= \
pnpm --filter @vecta/api dev
```

The api refuses to start and logs:
```
Refusing to start: missing required production env vars:
DATABASE_URL, WEB_ORIGIN, COOKIE_SECURE=true.
```
