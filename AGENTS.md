# AGENTS.md — VECTA Train

Guidance for AI coding agents working in this repo. Read this before making changes.

## Project

VECTA Train ingests wearable running data from Strava API, computes Banister TRIMP per activity, aggregates weekly load, and shows it on a dashboard. Phase 1 is deterministic analytics only — no AI coaching.

## Stack

- pnpm workspace (`pnpm@12.15.0`, Node >= 24) with two packages: `client/` and `server/`.
- **Client** — Vite 8, React 19, TanStack Query 5, tRPC 11 via `@trpc/tanstack-react-query`. Styling is plain CSS (cascade layers + design tokens); no Tailwind, no CSS-in-JS. Client-side routing is React Router in data-router mode: one route table in `client/src/router.tsx`, mounted at the app root; the backlog lives in `docs/features/client-router/00-backlog.md`.
- **Server** — Fastify 5 with `@fastify/cors`, tRPC 11 via the Fastify adapter. Drizzle ORM + `pg` are installed but there is no schema or DB code yet; `drizzle.config.ts` expects `server/src/db/schema.ts`.
- **Database** — PostgreSQL 18 locally via `docker-compose.yml`, published on host port `5433`.
- **Tooling** — TypeScript 7 (strict, `noEmit`), Biome 2 for lint/format, dependency-cruiser 18 for boundaries, Vitest 5 (+ React Testing Library on the client, Playwright for E2E). `tsx` runs the server in dev; Vercel bundles it in production.

## Layout & architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) — the codebase map, the target module shape (`server/src/modules/<name>/{transport,domain,data}` plus `server/src/{db,trpc,plugins}`), the runtime shape, and the mechanically enforced boundaries. Read its **Invariants** section before building any new layer.

## Design system

Apply the `vecta-design-system` skill for any UI work — do not invent colors, fonts, or spacing. The system is vendored in `client/src/ui/` and consumed from source.

## Commands

```bash
pnpm install
pnpm dev                 # vite on :5173, fastify on :3001
pnpm build               # client build + server typecheck (server emits nothing)
pnpm typecheck
pnpm lint                # biome + depcruise
pnpm test                # vitest per workspace; the server workspace still exits 1 until its first test file exists
pnpm test:e2e            # playwright; boots client + server via webServer (no .env needed)
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
- **Environment** — the client reads `VITE_TRPC_URL` (absolute URL ending in `/trpc`; inlined at build time, so it must be set for every Vercel environment). The server reads `DATABASE_URL` and `CORS_ORIGINS` (comma-separated origins); `PORT` and `HOST` are for local runs only. Preview deployments get unique hostnames; keep `CORS_ORIGINS` in sync, or use Vercel Related Projects to resolve the peer deployment. (Why cross-origin CORS is needed at all: see ARCHITECTURE.md → Runtime shape; the `.ts`-extension rule: see ARCHITECTURE.md → Boundaries.)
- If session cookies are reintroduced, they will be cross-site: use `SameSite=None; Secure`, enable `credentials` in `@fastify/cors`, and send `credentials: 'include'` on the tRPC link.

## Release & PR workflow

- `main` is the release branch; branch features from it and PR back to it.
- Use Conventional Commit titles.
- No CI, PR-title enforcement, or semantic-release is configured in this repo yet.

## Conventions

- **Don't commit without explicit authorization.** Stage the work, summarize what is about to be committed, and wait for the user to say "commit" (or equivalent) before running `git commit`. This applies to every commit, including docs-only changes and follow-up fixes; no commit is implicit.
- **TypeScript strict everywhere** (`tsconfig.base.json` has `strict: true`). No `any` without justification.
- **Layering, import extensions, and secrets** — see ARCHITECTURE.md → Boundaries and Invariants. `pnpm lint` enforces the boundaries mechanically; follow the target module shape when adding modules.
- **Shared types** flow from the server: the client imports them type-only through the `@vecta/*` path aliases in `tsconfig.base.json` (`@vecta/server/router`, `@vecta/client/*`). Don't duplicate request/response interfaces in `client/`.
- **Tests**: Vitest in both workspaces — jsdom + React Testing Library for `client/` (jest-dom matchers via `client/src/test/setup.ts`), node for `server/`. Behavior tests, not implementation tests. Co-locate `*.test.ts(x)` next to the file under test. Client tests resolve `@vecta/*` only because `client/vitest.config.ts` sets `resolve.tsconfigPaths` — keep that in sync with `vite.config.ts`. E2E lives in the root-level `e2e/` folder, driven by `playwright.config.ts` (repo root), which boots the Vite client and Fastify server itself; run `pnpm exec playwright install` once per machine. Keep E2E smoke-level — integration concerns belong in Vitest.
- **Don't code outside the prompt.** Ask questions if anything is unclear before writing the first line of code.
- **Suggest update related documentation**: Once we finish any work, suggest to update AGENTS.md and/or ARCHITECTURE.md

## Things to know before building the next layer

All of them live in ARCHITECTURE.md → **Invariants** (week boundaries, TRIMP null-HR and versioning, idempotent sync, encrypted tokens, no migrations on boot, authenticated procedures, Coach Brain stub). Read that section before implementing ingestion, TRIMP, aggregation, or auth.
