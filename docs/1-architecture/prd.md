# VECTA Train — PRD

VECTA Train is a modular monolith built around strict, mechanically-enforced layering, server-side sessions, and continuous deployment gated by feature flags. It ingests wearable running data (Strava/COROS), computes Banister TRIMP per activity, aggregates weekly load, and shows it on a dashboard. Phase 1 is deterministic analytics only — auth, feature flags, and the first UI surfaces.

This PRD describes the project's foundation. Stack, layout, and module-level details live in the spec files alongside.

## Goals

1. **One codebase, one deployment.** A single repo with two workspaces (`client/`, `server/`), one Postgres database, one production deployment.
2. **Vertical slices over horizontal layers.** Every domain area lives in one folder and is internally split into three sub-layers (`transport` / `domain` / `data`). Dependencies point inward only — `domain` knows nothing of Fastify, tRPC, Drizzle, or `pg`.
3. **Mechanically enforced boundaries.** Layer violations fail the build (dependency-cruiser). Tests do not police architecture.
4. **Framework-agnostic domain.** Domain services are unit-tested with in-memory fakes; the same code can be exposed via tRPC today and REST/GraphQL tomorrow without rewriting business logic.
5. **Safe continuous deployment.** Code is deployed continuously; a feature reaches users only when its flag is enabled. Migrations follow an expand/contract discipline so old and new code coexist.
6. **Single front door in production.** SPA and API share an origin, so the session cookie is first-party and no CORS configuration is needed.
7. **One process per concern.** Anything that can run inside a request runs inside a request. Long-lived background work (e.g. Strava sync) is a separate process and never a serverless function.

## Non-goals

- Multi-tenant, multi-region, or multi-database deployments.
- A native mobile client.
- Real-time / WebSocket workloads (tRPC subscriptions are available, none are used in Phase 1).
- AI coaching / Coach Brain logic (the module exists as an inert stub only).
- Automated training plan generation, injury prediction, nutrition modeling, multi-sport optimization.
- Strava / COROS sync providers (deferred to later work; module path is reserved).

## Constraints

These apply to every change. Where they are enforced mechanically, see the relevant spec.

1. **Layering is enforced mechanically.** `domain` never imports `data`, `transport`, or any framework. The build fails otherwise.
2. **Migrations are expand/contract.** Code with a flag off and code with it on run against the same database.
3. **TRIMP tolerates missing heart-rate data.** When the formula lands, absent `avgHR` stores `trimpValue: null` and the pipeline continues. It never throws.
4. **TRIMP formulas are versioned.** `banister-v1.ts` is never edited in place; a change adds `banister-v2.ts` and a new `formulaVersion` so historical records stay reproducible.
5. **Sync is idempotent.** Ingestion dedupes on `(athleteId, provider, externalId)`.
6. **Week boundaries respect `AthleteSettings.weekStartDay`.** Weekly aggregation defaults to Monday only when the setting is absent.
7. **OAuth provider tokens are encrypted at rest** and never logged.
8. **Migrations never run on boot or in a build command.**
9. **Coach Brain contains no logic** until a later phase.
10. **All athlete-data endpoints are authenticated** via `protectedProcedure` or `adminProcedure`.

## Target shape

```
vecta-train/
├── client/     React SPA — Vite + React Router
└── server/     Node API  — Fastify + tRPC + Drizzle
```

- **Server modules in Phase 1:** `auth`, `flags`, `health`.
- **Server modules reserved for later work:** `sync`, `athletes-profile`, `activities`, `trimp`, `weekly-load`, `coach-brain` (stub only).
- **Deployment:** SPA + API on one Vercel project; database on Neon.

## How to read this folder

| File | Audience | Use when |
|---|---|---|
| `prd.md` (this file) | Anyone | Onboarding or deciding scope |
| `spec-1-stack-and-foundation.md` | Implementer | Picking a package, setting up a workspace, or wiring layer boundaries |
| `spec-2-server-modules.md` | Implementer | Building or modifying `auth`, `flags`, `health`; changing the schema |
| `spec-3-deployment.md` | Implementer / SRE | Changing local dev, CI, or hosting |
| `spec-4-client-architecture.md` | Implementer | Building any UI surface |
| `spec-5-tooling-and-testing.md` | Implementer | Touching lint, format, hooks, or test setup |
| `spec-6-build-order.md` | Implementer | Picking the next step in the build sequence |

Specs are written to be self-contained: an agent implementing a single ticket should be able to pull the relevant spec and this PRD and start coding without reading the others. Cross-references are explicit when needed.
