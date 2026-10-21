# Spec 2 — Server modules, procedures, and data model

What each module exposes, how procedures are typed, and the tables the data layer owns. Cross-references: layered layout and composition root in [`spec-1-stack-and-foundation.md`](spec-1-stack-and-foundation.md); flag schema and evaluation in [`spec-3-deployment.md`](spec-3-deployment.md) — see the flag subsystem note below.

## 1. Modules

### 1.1 auth

**Procedures:** `auth.signUp`, `auth.signIn`, `auth.signOut`, `auth.me`

**Domain behaviour**

- Passwords hashed with argon2.
- **Timing-oracle defence on sign-in:** always execute `argon2.verify`, using a precomputed dummy hash when the email is unknown, so response latency does not reveal whether an account exists. The error message is generic regardless.
- Duplicate email raises a domain conflict error, mapped by transport to a `CONFLICT` code.

**Sessions**

- Session id: 32 random bytes, base64url-encoded. Opaque; carries no data.
- TTL: 30 days.
- Cookie `vt_sid`: `httpOnly`, `SameSite=Lax`, `Secure` in production, `Path=/`.
- Expired sessions are deleted on lookup and reported as absent.
- `lastUsedAt` is updated on use.

**Athlete entity**

```ts
interface Athlete {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;   // ISO-8601 YYYY-MM-DD
  role: 'admin' | 'athlete';
}
```

### 1.2 flags

Feature-flag evaluation, admin-only. The data schema, evaluation rules, enforcement, and administration are detailed in [`spec-3-deployment.md`](spec-3-deployment.md) § "Feature flags".

Transport exposes:

- `flags.list` — readable by any authenticated athlete, so the client knows which interface to render.
- `flags.set` — `adminProcedure` only.
- `flags.delete` — `adminProcedure` only.

### 1.3 health

`GET /health` — liveness check for the platform.

## 2. Procedure types

| Procedure | Requires |
|---|---|
| `publicProcedure` | nothing |
| `protectedProcedure` | valid session; sets `ctx.athlete` |
| `adminProcedure` | valid session **and** `ctx.athlete.role === 'admin'` |

Non-admins calling an admin procedure receive `FORBIDDEN`, not `UNAUTHORIZED`. 401 means "not authenticated"; 403 means "authenticated, not permitted". These are distinct and are never conflated.

## 3. Data model

| Table | Purpose |
|---|---|
| `athletes` | Account: email (unique), names, birth date, password hash, `role` |
| `sessions` | Opaque session id, athlete reference, expiry, last-used timestamp |
| `feature_flags` | See [`spec-3-deployment.md`](spec-3-deployment.md) § "Feature flags" |

**Indexes**

- `sessions(athleteId)`
- `sessions(expiresAt)`
- Unique constraint on `athletes.email`
