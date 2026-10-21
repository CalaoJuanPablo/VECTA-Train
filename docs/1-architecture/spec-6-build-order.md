# Spec 6 — Build order

Each step leaves the repository in a working state. Follow this order top to bottom; do not reorder steps and do not skip steps that introduce tests before the thing they test.

## Step 1 — Repository

Initialize a flat repository with two pnpm workspaces, `client/` and `server/`, and these root files:

- `package.json` — `private: true`, `workspaces: ["client", "server"]`
- `pnpm-workspace.yaml`
- `tsconfig.base.json` — strict TypeScript shared by both workspaces
- `biome.json`
- `.dependency-cruiser.js`
- `.gitignore`
- `.env.example`
- `AGENTS.md`, `README.md`

## Step 2 — Postgres

Create `docker-compose.yml` with the single `postgres` service from `spec-3-deployment.md` § "Local development". Bring it up and verify `:5433` is reachable.

## Step 3 — Server foundation

`server/` workspace:

- `env.ts` — zod-validated environment; production boot guard.
- `db/schema.ts` — Drizzle table definitions (start with `athletes` and `sessions`; add `feature_flags` in step 8).
- `drizzle.config.ts`
- Generate and apply the initial migration. Migration SQL committed under `server/drizzle/`.

## Step 4 — Server domain first

Build the `auth` module's domain layer **before** any repository:

- `auth/domain/entities.ts` — `Athlete`, `Session`, errors.
- `auth/domain/ports.ts` — `AthleteRepository`, `SessionRepository`, `PasswordHasher`.
- `auth/domain/auth.service.ts` — `signUp`, `signIn`, `signOut`, `resolveSession`.
- In-memory fakes of the ports; unit tests for the service against the fakes.

This step exists to prove the domain has no framework dependencies. Do not import any tool from `server/src/trpc/`, `server/src/db/`, or any external package beyond zod.

## Step 5 — Server data

Build the concrete implementations behind the domain ports:

- `auth/data/athlete.repository.ts`, `session.repository.ts` — Drizzle queries against `db/schema.ts`.
- `auth/data/argon2.password-hasher.ts` — uses the precomputed dummy hash pattern for timing-oracle defence.
- `auth/data/mappers.ts` — Drizzle row ↔ domain entity translation. Birth date is `string` (`YYYY-MM-DD`) in the domain, `Date` in the row — see the mappers-are-leak-barrier rule in `spec-1-stack-and-foundation.md`.

Data-layer tests run against the container Postgres from step 2.

## Step 6 — Server transport

Wire the Fastify app and tRPC:

- `trpc/trpc.ts` — `initTRPC`, `publicProcedure`, `protectedProcedure`, `adminProcedure`.
- `trpc/context.ts` — composition root; constructs the services map.
- `auth/transport/router.ts`, `auth/transport/schemas.ts` — `auth.signUp`, `auth.signIn`, `auth.signOut`, `auth.me`.
- `app.ts` — Fastify factory; injectable for tests.
- `index.ts` — env guard, build app, start.
- `health/transport/router.ts` — `GET /health`.

Add a Vitest integration test that exercises the sign-up → me → sign-out round trip.

## Step 7 — Enforce boundaries

Wire dependency-cruiser and `.dependency-cruiser.js` per `spec-1-stack-and-foundation.md` § "Boundary enforcement". **Confirm `pnpm lint` fails on a deliberate `domain → data` import before removing it.** That negative test is the proof the rules are wired.

## Step 8 — Flags module

The flags subsystem is its own module with its own table.

- `flags/data/flag.repository.ts` — Drizzle queries against `feature_flags`.
- `flags/domain/evaluator.ts` — first-match-wins logic + 60-second TTL cache.
- `flags/domain/flag.service.ts` — `list`, `set`, `delete` operations with cache invalidation on write.
- `flags/transport/router.ts` — `flags.list` (protected), `flags.set` / `flags.delete` (admin).
- Boot guard refuses `VECTA_FLAGS` when `NODE_ENV=production`.
- Add `pnpm --filter server user:promote <email>` command to grant admin.

Add a flag named `dashboard` so the build order below has something to gate.

## Step 9 — Client

`client/` workspace:

1. Vite scaffold (`vite.config.ts`, `index.html`, `main.tsx`, `App.tsx`).
2. Design system: tokens, themes, and components under `client/src/ui/`.
3. Forms: `FormsProvider`, `useForm`, zustand-backed store.
4. tRPC client: `client/src/trpc.ts` with `httpBatchLink`, `superjson`, `credentials: 'include'`.
5. Login feature: page, form, `auth-ui-store`.
6. Dashboard feature: page that calls `auth.me`; redirects to login on 401.

## Step 10 — Top-level docs

`AGENTS.md` describes the project (see PRD for the project description). `README.md` documents the run-book: install, dev, build, the auth round trip, the flags round trip.

## Step 11 — Verify

- `pnpm build`, `pnpm lint`, `pnpm test` are clean.
- Start the stack; complete sign-up → sign-in → me → sign-out through the browser.
- Confirm the `vt_sid` cookie and the auth redirect.
- Exercise a flag: disabled; enabled for admin; rolled out to 100%. Confirm the dashboard surface appears at each stage.
