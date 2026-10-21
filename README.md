# VECTA Train

VECTA Train ingests wearable running data (Strava/COROS), computes Banister TRIMP per activity, aggregates weekly load, and shows it on a dashboard. Phase 1 is deterministic analytics only — auth, feature flags, and the first UI surfaces.

**Status:** pre-implementation. There is no runnable code yet. The repository is being built from scratch per [`docs/1-architecture/`](docs/1-architecture/).

**Target stack:** pnpm workspaces; `client/` (Vite + React 19) and `server/` (Fastify + tRPC + Drizzle); Node 24, PostgreSQL 18.

## Where to look

- **[`AGENTS.md`](AGENTS.md)** — project guidance, conventions, the commit-authorization rule, and the commands that will work once the rebuild ships. Read this before opening a PR.
- **[`docs/1-architecture/prd.md`](docs/1-architecture/prd.md)** — product description, goals, non-goals, and the durable constraints.
- **[`docs/1-architecture/spec-6-build-order.md`](docs/1-architecture/spec-6-build-order.md)** — the 11-step sequence to initialize and build the project.
- **[`docs/1-architecture/spec-*.md`](docs/1-architecture/)** — implementation details per area (stack, server modules, deployment, client, tooling).

## Out of scope — flag, don't build

- AI coaching / Coach Brain logic (inert stub only)
- Automated training plan generation
- Injury prediction, nutrition/recovery modeling, multi-sport optimization
