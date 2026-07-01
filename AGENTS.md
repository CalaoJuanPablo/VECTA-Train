# AGENTS.md — VECTA Train

Guidance for AI coding agents working in this repo. Read this before making changes.

## Project

VECTA Train ingests wearable running data (Strava/COROS), computes Banister TRIMP per activity, aggregates weekly load, and shows it on a dashboard.

The intended target stack and domain modules are described in **"Phase 1 scope"** below. **None of those modules exist yet** — what is currently in the repo is the monorepo scaffold plus a first frontend feature (the login page). Treat Phase 1 as the destination, not the current state: do not implement Phase 1 modules without an explicit ticket, but write new code in a way that won't paint us into a corner when they land.

## Current state (what is actually in the repo today)

```
apps/
  api/    NestJS 11 backend — generic "items" CRUD example, in-memory, no DB yet
          Endpoints: GET /health, GET /items, POST /items
  web/    Next.js 16 (App Router) + React 19
          src/app/
            page.tsx        # home / placeholder
            login/          # sign-in & sign-up UI (UI-only, no auth backend yet)
          src/forms/        # FormsProvider + useForm (zustand-backed)
          src/lib/api-client.ts

packages/
  design-system/   @vecta/design-system — see "Design system" below
  shared-types/    @vecta/shared-types — TS source, consumed directly (only `Item` exists)
  eslint-config/   @vecta/eslint-config — eslint-config-love + prettier
```

- **Backend has no DB and no domain logic.** `apps/api` is a single `ItemsController` over an in-memory array. There is no Prisma, no Postgres, no Redis/BullMQ.
- **No auth backend.** The login page is UI-only with client-side zod validation; submit handlers are stubs (`apps/web/src/app/login/login-form.tsx`).
- **Tests exist** for the design-system components and for `useForm` / the login form. There are no API tests yet.
- The current branch `feat/add-login-page` is the active line of work; recent commits have been git-workflow / lint / prettier chores plus the login page itself.

## Phase 1 scope (planned — not yet implemented)

When these modules are added, the rules below apply. Do **not** build any of this speculatively; only implement the pieces an explicit ticket calls for.

- **Frontend**: `apps/web` continues to host the dashboard, activities list, activity detail, calendar, insights, settings.
- **Backend**: `apps/api` NestJS — modules planned under `src/modules/`:
  - `athletes/` (profile + `AthleteSettings.weekStartDay`)
  - `activities/` (CRUD + listing, grouped by week)
  - `trimp/formulas/` (versioned formula implementations, e.g. `banister-v1.ts`)
  - `sync/providers/` (Strava, COROS)
  - `weekly-load/` (aggregation)
  - `coach-brain/` — **inert stub only.** No real coaching logic in Phase 1.
- **DB**: PostgreSQL + Prisma (pgvector reserved for future Coach Brain embeddings — not used in Phase 1 queries).
- **Jobs/Queue**: BullMQ + Redis for sync jobs.
- **Hosting**: Vercel (web), Railway/Render (api + Postgres + Redis).

### Phase 1 out of scope — flag, don't build

If a task description implies any of these, stop and flag it instead of building:

- AI coaching / "Coach Brain" logic beyond the inert stub
- Automated training plan generation
- Injury prediction, nutrition/recovery modeling, multi-sport optimization

## Stack

- **Monorepo**: Turborepo 2 + pnpm 11 workspaces (`pnpm-workspace.yaml`), Node >= 24
- **Backend**: `apps/api` — NestJS 11, TypeScript 6, ESLint 10
- **Frontend**: `apps/web` — Next.js 16 (App Router), React 19, TypeScript 6
- **Web state**: zustand (UI state, e.g. `auth-ui-store`); custom **Forms Provider** for form state (multiple named forms per provider, zustand-backed) — see `apps/web/src/forms/`
- **Web validation**: zod schemas co-located with forms (e.g. `apps/web/src/app/login/schemas.ts`)
- **Web API access**: `apps/web/src/lib/api-client.ts` — fetch wrapper; reads `NEXT_PUBLIC_API_URL` (defaults `http://localhost:3001`)
- **Design system**: `@vecta/design-system` — see "Design system" below
- **Shared types**: `@vecta/shared-types` — TS source, consumed directly (no build step)
- **Lint/format**: ESLint via `@vecta/eslint-config` (extends `eslint-config-love` + `eslint-config-prettier`); Prettier for formatting
- **Tests**: Vitest + `@testing-library/react` + jsdom, in both `apps/web` and `packages/design-system`. Run without starting the Next dev server.

## Design system

`@vecta/design-system` is the source of truth for every UI surface in this repo. Apply the `vecta-design-system` skill for any UI work — do not invent ad-hoc colors, fonts, or spacing.

- **CSS foundation**: design tokens as `--vt-*` custom properties under `src/tokens/` (base + semantic); themes in `src/themes/` (light + dark); cascade layers in `src/layers.css` with fixed order `reset, tokens, theme, core, overrides`. Token CSS is deep-imported by `apps/web/src/app/layout.tsx`.
- **Styling pattern**: CSS Modules. Each `*.module.css` does `@import '@vecta/design-system/src/layers.css'` then wraps rules in `@layer core { ... }`, using `var(--vt-*)` tokens.
- **Component organization**: atomic design under `src/components/`
  - `atoms/` — Button, TextLink
  - `molecules/Fields/` — Field + TextField/EmailField/PasswordField/DateField
  - `organisms/` — reserved (empty)
- **Components are pure-visual.** No form logic, no API calls. Form state, errors and validation live in the consuming app (via `useForm`); DS field components only render markup + ARIA wiring.
- **Each component has co-located `*.test.tsx` and `*.stories.tsx`.**
- **No build step.** Consumed from source: `package.json` `main`/`types` → `src/components/index.ts`; `apps/web/next.config.js` lists it in `transpilePackages`. Vitest must inline it (`test.server.deps.inline: [/@vecta\/design-system/]`).
- **Storybook** (`@storybook/react-vite` v10) — `pnpm --filter @vecta/design-system storybook` / `build-storybook`. Config in `.storybook/`; `preview.ts` imports token/theme CSS globally. `esbuild` is listed in `pnpm-workspace.yaml` `allowBuilds` for Storybook's bundler.

## Commands

```bash
pnpm install
pnpm dev            # turbo run dev — api on :3001, web on :3000
pnpm build          # turbo run build
pnpm lint           # turbo run lint
pnpm test           # turbo run test (vitest in web + DS)
pnpm format         # prettier --write .

# Per-package
pnpm --filter @vecta/api start:dev          # nest start --watch
pnpm --filter @vecta/web dev                 # next dev
pnpm --filter @vecta/web test                # vitest run (web)
pnpm --filter @vecta/design-system test      # vitest run (DS)
pnpm --filter @vecta/design-system storybook # DS docs on :6006
```

## Conventions

- **TypeScript strict everywhere** (`tsconfig.base.json` has `strict: true`). No `any` without justification.
- **NestJS module layout** (when domain modules land): one folder per domain — `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`. Use NestJS DI; don't `new` services up.
- **Shared request/response shapes** go in `packages/shared-types`. Import from there in both apps — don't redefine the same interface in `apps/web` and `apps/api`.
- **Secrets**: OAuth provider tokens must be encrypted at rest. Never log raw tokens or payloads that contain them.
- **Tests**: Vitest + RTL, run under jsdom. Behavior tests, not implementation tests. Co-locate `*.test.ts(x)` next to the file under test.

## Things to know before building the next layer

These are guardrails so new code doesn't block Phase 1 work:

1. **Don't hardcode week boundaries** to Monday. When weekly aggregation lands it must respect `AthleteSettings.weekStartDay`; default Monday only when unset.
2. **TRIMP must tolerate missing HR.** When the formula lands, missing `avgHR` should store `trimpValue: null` and let the sync pipeline continue — never throw.
3. **TRIMP formula versioning.** When the formula lands, never edit `banister-v1.ts` in place. Add `banister-v2.ts` and a new `formulaVersion` value so v1 records stay reproducible.
4. **Idempotent sync.** When ingestion lands, dedupe on `(athleteId, provider, externalId)`.
5. **Coach Brain is a stub.** Do not add real coaching logic to `apps/api/src/modules/coach-brain/` until Phase 2.
6. **API client.** Add new endpoints to `apps/web/src/lib/api-client.ts`; don't open-code `fetch(...)` calls in components.