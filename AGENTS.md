# AGENTS.md — VECTA Train

Guidance for AI coding agents working in this repo. Read this before making changes.

## Project

VECTA Train ingests wearable running data (Strava/COROS), computes Banister TRIMP per activity, aggregates weekly load, and shows it on a dashboard. Phase 1 is deterministic analytics only — no AI coaching.

The repo is still an early skeleton: the client renders a single tRPC `getHello` query. Ingestion, the database schema, auth, feature flags, TRIMP, and the dashboard are **not** implemented yet.

## Stack

- pnpm workspace (`pnpm@12.15.0`, Node >= 24) with two packages: `client/` and `server/`.
- **Client** — Vite 8, React 19, TanStack Query 5, tRPC 11 via `@trpc/tanstack-react-query`. Styling is plain CSS (cascade layers + design tokens); no Tailwind, no CSS-in-JS, no router.
- **Server** — Fastify 5 with `@fastify/cors`, tRPC 11 via the Fastify adapter. Drizzle ORM + `pg` are installed but there is no schema or DB code yet; `drizzle.config.ts` expects `server/src/db/schema.ts`.
- **Database** — PostgreSQL 18 locally via `docker-compose.yml`, published on host port `5433`.
- **Tooling** — TypeScript 7 (strict, `noEmit`), Biome 2 for lint/format, dependency-cruiser 18 for boundaries, Vitest 5. `tsx` runs the server in dev; Vercel bundles it in production.

## Layout

```
client/src/
  App.tsx, main.tsx
  pages/          screens (currently home/)
  ui/             design system: tokens/, themes/, reset, layers
  utils/trpc.ts   the only tRPC client
server/src/
  server.ts       Fastify entrypoint (also Vercel's Fastify entrypoint)
  router.ts       tRPC router (currently getHello)
```

## Design system

Apply the `vecta-design-system` skill for any UI work — do not invent colors, fonts, or spacing. The system is vendored in `client/src/ui/` and consumed from source; there is no separate `@vecta/design-system` package. Tokens and themes live in `client/src/ui/tokens/` and `client/src/ui/themes/`.

## Commands

```bash
pnpm install
pnpm dev                 # vite on :5173, fastify on :3001
pnpm build               # client build + server typecheck (server emits nothing)
pnpm typecheck
pnpm lint                # biome + depcruise
pnpm test                # vitest in both workspaces; exits 1 until a test file exists
pnpm format              # biome format --write .

# Per-package
pnpm --filter client preview
pnpm --filter client build
pnpm --filter server dev
pnpm --filter server build
pnpm --filter server typecheck
pnpm --filter server db:generate            # needs server/src/db/schema.ts
pnpm --filter server db:migrate
```

Each package loads its own `.env`; copy the co-located `.env.example` first. `.env` files are git-ignored.

## Deployment

Two Vercel projects are built from this repo; each sets its **Root Directory** to the package directory, so `vercel.json` lives in `client/` and `server/`, not at the repo root.
- **Client project** (`client/vercel.json`) — Vite preset, `pnpm build`, output `dist`, SPA fallback rewrite `/(.*) → /index.html`.
- **Server project** (`server/vercel.json`) — Fastify preset, `pnpm build`, no rewrites. `src/server.ts` is a Vercel Fastify entrypoint and becomes a single function.
- **Server module resolution** — Vercel compiles `server/src` file by file and runs the output as ESM, so relative imports must carry the `.ts` extension (`./router.ts`); TypeScript rewrites it to `.js` on emit. Path aliases do not work in server runtime code because `paths` is typecheck-only. `pnpm lint` enforces this.
- **Environment** — the client reads `VITE_TRPC_URL` (absolute URL ending in `/trpc`; inlined at build time, so it must be set for every Vercel environment). The server reads `DATABASE_URL` and `CORS_ORIGINS` (comma-separated origins); `PORT` and `HOST` are for local runs only.
- **Cross-origin** — SPA and API are separate origins in every environment, so CORS is required. Preview deployments get unique hostnames; keep `CORS_ORIGINS` in sync, or use Vercel Related Projects to resolve the peer deployment.
- If session cookies are reintroduced, they will be cross-site: use `SameSite=None; Secure`, enable `credentials` in `@fastify/cors`, and send `credentials: 'include'` on the tRPC link.

## Release & PR workflow

- `main` is the release branch; branch features from it and PR back to it.
- Use Conventional Commit titles.
- No CI, PR-title enforcement, or semantic-release is configured in this repo yet.

## Conventions

- **Don't commit without explicit authorization.** Stage the work, summarise what is about to be committed, and wait for the user to say "commit" (or equivalent) before running `git commit`. This applies to every commit, including docs-only changes and follow-up fixes; no commit is implicit.
- **TypeScript strict everywhere** (`tsconfig.base.json` has `strict: true`). No `any` without justification.
- **Layering is enforced mechanically** by dependency-cruiser. `domain` never imports `data`, `transport`, `db`, or any framework. The rules expect `server/src/modules/<name>/{domain,data,transport}` plus `server/src/{db,trpc,plugins}`; follow that shape when adding modules.
- **Shared types** flow from the server: the client imports them type-only through the `@vecta/*` path aliases in `tsconfig.base.json` (`@vecta/server/router`, `@vecta/client/*`). Don't duplicate request/response interfaces in `client/`.
- **Server relative imports carry the `.ts` extension** (`from './router.ts'`). Vercel emits per-file ESM and Node resolves each specifier literally, so `pnpm lint` fails on extensionless relative imports; `@vecta/*` aliases are typecheck-only and cannot be used in server runtime code. The client is bundled by Vite and keeps extensionless imports.
- **Secrets**: OAuth provider tokens must be encrypted at rest. Never log raw tokens or payloads that contain them.
- **Tests**: Vitest in both workspaces — jsdom for `client/`, node for `server/`. Behavior tests, not implementation tests. Co-locate `*.test.ts(x)` next to the file under test. React Testing Library is not installed yet; add it if a UI test needs it.
- **API access.** All requests go through the tRPC client in `client/src/utils/trpc.ts`; don't open-code `fetch(...)` calls in components, and don't hardcode the API URL.
- **Don't code outside the prompt.** Ask questions if anything is unclear before writing the first line of code.

## Things to know before building the next layer

1. **Don't hardcode week boundaries** to Monday. When weekly aggregation lands it must respect `AthleteSettings.weekStartDay`; default Monday only when unset.
2. **TRIMP must tolerate missing HR.** When the formula lands, missing `avgHR` should store `trimpValue: null` and let the sync pipeline continue — never throw.
3. **TRIMP formula versioning.** When the formula lands, never edit `banister-v1.ts` in place. Add `banister-v2.ts` and a new `formulaVersion` so v1 records stay reproducible.
4. **Idempotent sync.** When ingestion lands, dedupe on `(athleteId, provider, externalId)`.
5. **Coach Brain is a stub.** Do not add real coaching logic until Phase 2.
6. **Auth is not built yet.** When it lands, all procedures that touch athlete data must be guarded with `protectedProcedure` or `adminProcedure`, and the client must send the session cookie on every call.
