# AGENTS.md — VECTA Train (Phase 1)

Guidance for AI coding agents working in this repo. Read this before making changes.

## Project

VECTA Train ingests wearable running data (Strava/COROS), computes Banister TRIMP per activity, aggregates weekly load, and shows it on a dashboard. Phase 1 is deterministic analytics only.

**Out of scope for Phase 1 — do not implement, even if asked in a vague ticket:**

- AI coaching / "Coach Brain" logic (module exists as an inert stub only)
- Automated training plan generation
- Injury prediction, nutrition/recovery modeling, multi-sport optimization

If a task description implies any of the above, flag it instead of building it.

## Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: `apps/web` — Next.js (App Router), TypeScript
- **Backend**: `apps/api` — NestJS, TypeScript
- **DB**: PostgreSQL + Prisma (pgvector extension reserved for future Coach Brain embeddings — not used in Phase 1 queries)
- **Jobs/Queue**: BullMQ + Redis (sync jobs)
- **Shared types**: `packages/shared-types` — single source of truth for types used by both apps
- **Hosting**: Vercel (web), Railway/Render (api + Postgres + Redis)

## Repo structure

```
apps/
  api/
    src/modules/
      athletes/        # profile + AthleteSettings (weekStartDay)
      activities/       # CRUD + listing, grouped by week
      trimp/
        formulas/        # banister-v1.ts — versioned formula implementations
      sync/
        providers/       # strava.provider.ts, coros.provider.ts
      weekly-load/       # aggregation logic
      coach-brain/        # Phase 2 stub — DO NOT add real logic here yet
    prisma/schema.prisma
  web/
    src/app/
      dashboard/
      activities/[id]/
    src/components/
      charts/             # pace, HR, elevation
      dashboard/
packages/shared-types/
```

## Commands

```bash
pnpm install
pnpm dev          # turbo run dev — runs api + web
pnpm build        # turbo run build
pnpm lint         # turbo run lint
pnpm --filter api exec prisma migrate dev   # run migrations
pnpm --filter api exec prisma studio        # inspect DB
```

No test runner is set up yet. If adding tests, use Jest for `apps/api` (NestJS default) and Vitest or Jest + RTL for `apps/web`; check `package.json` first in case this has changed since this file was written.

## Data model (Prisma)

- `Athlete` — id, name, age, weight, restingHR, maxHR, **coachId (nullable — reserved for future multi-tenancy, do not remove)**
- `AthleteSettings` — athleteId, weekStartDay (0–6, default Monday)
- `Activity` — id, athleteId, provider, externalId, sportType, startTime, durationSeconds, distanceMeters, elevationGainMeters, avgHR, maxHR, rawData
- `ActivityStream` — time-series HR / pace / elevation per activity
- `TRIMPRecord` — id, activityId, athleteId, trimpValue, formulaVersion, calculatedAt
- `WeeklyLoad` — athleteId, weekStartDate, totalTRIMP, sessionCount, avgDailyTRIMP

## Domain rules agents must respect

1. **TRIMP formula versioning**: never edit `banister-v1.ts` in place to "fix" the formula. Add `banister-v2.ts` and a new `formulaVersion` value; `v1` records must remain reproducible.
2. **Missing HR data**: TRIMP computation must not throw on missing avgHR — store `trimpValue: null` and continue the sync pipeline (PRD 6.3).
3. **Idempotent sync**: ingestion must dedupe on `(athleteId, provider, externalId)`. Never create duplicate `Activity` or `TRIMPRecord` rows on re-sync.
4. **Week boundaries**: all weekly aggregation must respect `AthleteSettings.weekStartDay`, not a hardcoded Monday. Default is Monday only when unset.
5. **TRIMP formula**:
   ```
   HRr = (avgHR - restingHR) / (maxHR - restingHR)
   TRIMP = durationMinutes × HRr × e^(1.92 × HRr)
   ```

## API surface (PRD §9)

```
POST /athletes
GET  /athletes/:id
PUT  /athletes/:id/settings

GET  /activities/:id
GET  /athletes/:id/activities

POST /sync/:provider/:athleteId

GET  /athletes/:id/weekly-load
```

## Conventions

- Strict TypeScript everywhere (`tsconfig.base.json` sets `strict: true`) — no `any` without justification.
- NestJS: one module per domain folder (`*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`).
- Shared request/response shapes go in `packages/shared-types`, imported by both apps — don't redefine the same interface in `apps/web` and `apps/api`.
- OAuth tokens must be encrypted at rest; never log raw provider tokens or payloads containing them.

## Performance targets (PRD §10)

- Activity page load < 500ms
- Weekly dashboard load < 1s
- TRIMP calculation < 5ms per activity

Keep these in mind for any change touching the activity or weekly-load query paths — avoid N+1 queries when joining `Activity` → `TRIMPRecord` → `WeeklyLoad`.
