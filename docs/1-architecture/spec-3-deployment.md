# Spec 3 — Local development, production deployment, and feature flags

Everything that happens between the developer and the running stack, plus the feature-flag subsystem (it spans data, transport, and ops, so it lives here with deployment rather than in `spec-2`).

## 1. Local development

### 1.1 Docker runs the database, and nothing else

`docker-compose.yml` contains a single service:

```yaml
services:
  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: vecta
      POSTGRES_PASSWORD: vecta
      POSTGRES_DB: vecta
    ports:
      - '5433:5432'
    volumes:
      - vecta-postgres-data:/var/lib/postgresql/data
```

There is no `node` service. The server and client run natively on the host.

| Layer | Runs on |
|---|---|
| Postgres | Docker container, published on **:5433**, own named volume |
| Server | Host — `tsx watch` |
| Client | Host — Vite dev server |

File watching stays on the native filesystem. Vite HMR and `tsx watch` are noticeably slower when routed through a container bind mount, and that latency is felt continuously during development.

Resetting database state is `docker compose down -v`, which affects the database volume and nothing else.

### 1.2 Connection strings

```
# development — from the host, via the published port
DATABASE_URL="postgresql://vecta:vecta@localhost:5433/vecta"
```

### 1.3 Ports

| Service | Port |
|---|---|
| Vite dev server | 5173 |
| Fastify dev server | 3001 |

Locally the SPA and API are cross-origin but **same-site** (`http://localhost`), so `SameSite=Lax` cookies are sent. `@fastify/cors` is configured with `credentials: true` and an explicit origin allow-list for this reason. It is not required in production.

### 1.4 Commands

| Command | Action |
|---|---|
| `pnpm dev` | Vite and Fastify dev servers with watch |
| `pnpm build` | Production build of both workspaces |
| `pnpm test` | Vitest across both workspaces |
| `pnpm lint` | `biome check .` + `depcruise` |
| `pnpm format` | `biome format --write .` |
| `pnpm db:migrate` | `drizzle-kit migrate` |
| `pnpm db:generate` | `drizzle-kit generate` |

## 2. Production

### 2.1 Deployment shape

The SPA and the API are served from **a single Vercel project**, with the database on Neon.

```
                    ┌────────── one Vercel project ──────────┐
  browser ─────────►│  /        → CDN serves the SPA        │
                    │  /api/*   → Fastify as a Function     │
                    └──────────────────┬────────────────────┘
                                       │ DATABASE_URL
                                       ▼
                    ┌─────────────────────────────────────┐
                    │  Neon Postgres                      │
                    └─────────────────────────────────────┘
```

SPA and API share an origin, so the session cookie is first-party and no CORS configuration is needed. Splitting them into separate projects would introduce cross-origin requests and reintroduce cookie constraints.

Vercel provides first-class Fastify support, Node 24 LTS for builds and functions, and WebSocket support, so tRPC subscriptions are available.

### 2.2 Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon connection string. |
| `NODE_ENV` | `production`. |
| `COOKIE_SECURE` | `true` — required in production. |
| `VECTA_FLAGS` | Development-only flag override. **Rejected when `NODE_ENV=production`**. |

**Boot guard:** in production, startup fails unless `DATABASE_URL` is present and `COOKIE_SECURE` is `true`. Validation runs before any socket is opened.

### 2.3 Neon pool configuration

Two constraints from the platform:

**Use the pooled connection string with `prepare: false`.** The pooler operates in transaction mode, where prepared statements are not supported. The `pg` client must be constructed with `prepare: false` or queries fail at runtime.

```ts
new Pool({
  connectionString: env.DATABASE_URL,
  prepare: false,
  idleTimeoutMillis: 30_000,
  max_lifetime_seconds: 240,
});
```

**Compute scales to zero after five minutes idle.** Pool `idleTimeoutMillis` and `max_lifetime_seconds` are set below that threshold so connections are recycled before suspension. Connection errors (`ECONNRESET`) are caught and retried on a fresh connection.

### 2.4 Migrations

Migrations run from CI or manually, against `DATABASE_URL`:

```
pnpm db:migrate
```

Rules:

- **Never in the Vercel build command.** Preview deployments build too, which would apply production migrations during a pull request.
- **Never on server boot.** Serverless functions are invoked concurrently; boot-time migration would race every invocation and could apply a schema change to code that no longer expects it.
- Migration SQL is committed under `server/drizzle/`.

### 2.5 Sync worker

Strava and COROS sync runs as a **separate long-lived process**, not inside a request or function. Vercel Hobby cannot host one: scheduled jobs are limited to once per day, with up to an hour of scheduling jitter.

No sync implementation is in scope now. When it is built, `modules/sync/` follows the same layering and must not assume request-scoped execution.

## 3. Feature flags

Flags decouple **deployment** from **release**. Code is deployed continuously; a feature reaches users only when its flag is enabled.

```
merge → build → deploy to production → flag OFF
                                     → flag ON for admin account
                                     → ramp to all users
```

Validation happens in production against real data. No staging environment.

### 3.1 Schema

| Column | Type | Purpose |
|---|---|---|
| `key` | `text` (PK) | Flag identifier. |
| `description` | `text` | What it gates, and its removal condition. |
| `enabled_for_all` | `boolean` | Global on switch. |
| `rollout_percentage` | `integer` | 0–100. |
| `allowlist` | `text[]` | Athlete ids enabled regardless of rollout. |
| `created_at` / `updated_at` | `timestamptz` | Audit. |

### 3.2 Evaluation

First match wins:

1. `enabled_for_all` is true → **on**.
2. Athlete id is in `allowlist` → **on**.
3. `stableHash(key + athleteId) % 100 < rollout_percentage` → **on**.
4. Otherwise → **off**.

The hash is deterministic per flag and athlete, so a user does not oscillate between requests.

**Evaluation fails closed.** If the flag lookup errors, the feature is treated as **off**.

Results are cached in memory with a 60-second TTL so evaluation does not hit the database per request. The cache is invalidated on write.

### 3.3 Enforcement

Flags are enforced in **server procedures**, not only in React. Client-side gating is cosmetic — the bundle is readable by anyone. A feature gated solely by a hidden button is not gated.

```ts
const gatedProcedure = protectedProcedure.use(requiresFlag('dashboard'));
```

### 3.4 Administration

Only the admin may read and mutate flags. `flags.list` is readable by any authenticated athlete so the client knows which interface to render; `flags.set` and `flags.delete` require `adminProcedure`.

**Admin is granted explicitly.** `role` defaults to `'athlete'` on signup. There is no first-user-becomes-admin rule — that pattern lets whoever reaches a fresh instance first claim control. Admin is granted by command:

```
pnpm --filter server user:promote <email>
```

The command runs against production via the Neon SQL editor or a direct `psql` connection.

### 3.5 Migration constraint

With continuous deployment, code with a flag **off** and code with it **on** run against the same database. Migrations must therefore be backward compatible:

| Change | Rule |
|---|---|
| Add a nullable column | Safe. |
| Add a new table | Safe. |
| Add a `NOT NULL` column with a default | Safe. |
| Drop or rename a column | Forbidden while old code can still run. |
| Add `NOT NULL` without a default | Forbidden. |

Required sequence: **expand** (add, backfill, dual-write) → deploy → enable flag → **contract** (drop) in a later release, once the old code path is unreachable.

### 3.6 Hygiene

- Every flag records an owner and a removal condition.
- A flag at 100% for more than one release cycle is deleted.
- The environment-variable override exists for local development only and is refused in production.
