# Architecture

VECTA Train is a modular monolith: one repo, two workspaces (`client/`, `server/`), one Postgres database. It ingests wearable running data from Strava API, computes Banister TRIMP per activity, aggregates weekly load, and shows it on a dashboard. Phase 1 is deterministic analytics only.

This file is the map: where code lives, what may depend on what, and which invariants are non-obvious. Stack versions and commands live in [AGENTS.md](AGENTS.md); UI tokens/themes live in the `vecta-design-system` skill.

_Last updated: 2026-10-27. The repo is currently an early skeleton — sections marked **target** describe the intended shape, not code that exists today._

## Codebase map

Current, real layout:

```
vecta-train/
├── client/src/
│   ├── App.tsx, main.tsx   app root — RouterProvider inside QueryClientProvider
│   ├── router.tsx          the single route table (React Router data router) — pages register here
│   ├── theme-script.tsx    sets data-theme before paint — no theme flash, not React state
│   ├── pages/              screens, one folder per page (currently home/)
│   ├── ui/                 design system: tokens/, themes/, reset, layers — consumed from source, no build step
│   └── utils/trpc.ts       the single tRPC client — components never call fetch
├── server/src/
│   ├── server.ts           Fastify entrypoint (also Vercel's)
│   └── router.ts           tRPC app router (currently getHello)
├── scripts/                build & lint helpers (check-ts-extensions.mjs)
├── .dependency-cruiser.js  mechanical layer-boundary enforcement
├── docker-compose.yml      local Postgres 18 (host port 5433)
└── tsconfig.base.json      shared strict TS config + `@vecta/*` type-only aliases
```

**Client routing** uses React Router in data-router mode: `client/src/router.tsx` is the single route table at the app root (`/` renders the home page today), and unknown URLs will render a not-found page once backlog story #2 lands. Route elements can use TanStack Query/tRPC because `RouterProvider` mounts inside `QueryClientProvider`. See [docs/features/client-router/00-backlog.md](docs/features/client-router/00-backlog.md).

**Target** server layout — vertical slices, one folder per domain area:

```
server/src/
├── modules/<name>/
│   ├── transport/   tRPC routers, zod input schemas, DTO mapping — no business logic
│   ├── domain/      services, entities, ports (interfaces) — plain TypeScript, no frameworks
│   └── data/        Drizzle repositories implementing domain ports, mappers
├── shared/          cross-module pure types and utilities
├── db/              schema.ts, connection pool, migrations
├── trpc/            tRPC init, context, protected/admin procedures
└── plugins/         Fastify plugins (cors, cookie, …)
```

A transport procedure validates input, calls one domain service, and maps domain errors to `TRPCError`. Business branching does not belong there. `data/mappers.ts` is the leak barrier: driver row types (e.g. `Date`, Postgres `text[]`) are translated to domain representations there and nowhere else.

## Runtime shape

```
Browser ──► Vercel: client (Vite SPA, static)
        ──► Vercel: server (Fastify + tRPC, single function) ──► Postgres (Neon)
                                    ▲
Strava API ──► sync process ────────┘   (long-lived; separate process, never a serverless function)
```

SPA and API are **separate origins in every environment**, so CORS is required (`CORS_ORIGINS`); the client reads `VITE_TRPC_URL`. Anything that can run inside a request runs inside a request; only long-lived background work (Strava sync) gets its own process.

## Boundaries

Enforced mechanically by `.dependency-cruiser.js` (all `severity: 'error'`) — that file is the source of truth. In one line each:
- Dependencies point inward only: `transport → domain ← data`; no cycles.
- `domain` imports nothing from `transport/`, `data/`, `db/`, `trpc/`, `plugins/`, and no framework (`fastify`, `@trpc/*`, `drizzle-orm`, `pg`, `zod`, …). Domain services are unit-tested with in-memory fakes of their ports — no database, no mocking library.
- `data` never imports `transport` or transport frameworks; it owns SQL and the pool.
- `shared/` and domains never reach into module internals or infrastructure.
- Cross-module collaboration goes through the other module's `domain` interfaces only — never its `data/` or `transport/`.
- Relative imports in `server/src` carry the `.ts` extension; `@vecta/*` aliases are typecheck-only and forbidden in server runtime code (`scripts/check-ts-extensions.mjs`). Vercel emits per-file ESM and Node resolves each specifier literally, so `./router` typechecks and then crashes the deployed function; `./router.ts` is rewritten to `./router.js` on emit. The client is bundled by Vite and keeps extensionless imports.
- Biome owns style only, not boundaries; import cycles are caught by depcruise, not Biome.

## Invariants

True and non-obvious; newcomers cannot derive these from the code quickly:
- **TRIMP tolerates missing HR.** Absent `avgHR` stores `trimpValue: null` and the sync pipeline continues — it never throws.
- **TRIMP formulas are versioned.** `banister-v1.ts` is never edited in place; a change adds `banister-v2.ts` and a new `formulaVersion` so historical records stay reproducible.
- **Sync is idempotent.** Ingestion dedupes on `(athleteId, provider, externalId)`.
- **Week boundaries respect `AthleteSettings.weekStartDay`.** Weekly aggregation defaults to Monday only when the setting is absent — never hardcode Monday.
- **OAuth provider tokens are encrypted at rest** and never logged.
- **Migrations never run on boot or in a build command.**
- **All athlete-data endpoints are authenticated** via `protectedProcedure` or `adminProcedure`; the client sends the session cookie on every call.
- **Coach Brain is an inert stub.** No real coaching logic until Phase 2.

## Out of scope

Deliberately not built: multi-tenant/multi-region deployments, a native mobile client, real-time/WebSocket workloads (tRPC subscriptions are available, none are used in Phase 1), AI coaching, automated training-plan generation, injury prediction, nutrition modeling, multi-sport optimization.

Decision rationale belongs in ADRs, not here.
