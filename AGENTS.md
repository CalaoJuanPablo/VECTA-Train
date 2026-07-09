# AGENTS.md — VECTA Train

Guidance for AI coding agents working in this repo. Read this before making changes.

## Project

VECTA Train ingests wearable running data (Strava/COROS), computes Banister TRIMP per activity, aggregates weekly load, and shows it on a dashboard.

The intended target stack and modules are described in **"Phase 1 scope"** below. **None of those modules exist yet** — the repo is a monorepo scaffold plus a first frontend feature (the login page). Treat Phase 1 as the destination, not the current state: do not implement Phase 1 modules without an explicit ticket, but write new code in a way that won't paint us into a corner when they land.

## Repo state

What's actually here today:

```
apps/
  api/    NestJS 11 backend — Postgres + Prisma. Modules:
            src/prisma/                       # global PrismaService (lifecycle-managed client)
            src/modules/auth/                 # sign-up, sign-in, sign-out, /me + SessionGuard
            src/items/                        # generic in-memory CRUD placeholder (pre-Phase 1)
          Endpoints: GET /health, GET /items, POST /items,
                     POST /auth/sign-up, POST /auth/sign-in,
                     POST /auth/sign-out, GET /auth/me.
          Compiles to CommonJS. Local Postgres via `pnpm --filter @vecta/api db:up`.
  web/    Next.js 16 (App Router) + React 19
          src/app/
            layout.tsx, page.tsx          # home / static placeholder
            theme-script.tsx             # client component, sets data-theme + data-color-scheme on <html> from prefers-color-scheme
            login/                       # sign-in & sign-up UI; submit handlers call the api, redirect to /dashboard
            dashboard/                   # client page that calls /auth/me; redirects to /login on 401
          src/forms/                     # FormsProvider + useForm (zustand-backed, named forms per provider)
          src/lib/api-client.ts          # fetch wrapper with auth.{signUp,signIn,signOut,me};
                                          # reads NEXT_PUBLIC_API_URL (default http://localhost:3001);
                                          # always sends credentials: 'include' for cross-origin cookies

packages/
  design-system/   @vecta/design-system — see "Design system" below
  shared-types/    @vecta/shared-types — TS source, consumed directly
                   exports `Item` and auth types (`AuthUser`, `SignInInput`, `SignUpInput`, `AuthResponse`)
  eslint-config/   @vecta/eslint-config — eslint-config-love + prettier
```

Notes:

- There is **no Tailwind** in this repo. Every UI surface uses `@vecta/design-system`. The home page (`apps/web/src/app/page.tsx`) is a static placeholder.
- Auth uses server-side sessions stored in Postgres. Cookie name: `vt_sid` (httpOnly, SameSite=Lax, Secure in prod). No JWT signing — the cookie value is an opaque session id.
- Cross-origin caveat (web on Vercel, api on Render on `*.onrender.com`): the dashboard page calls `/auth/me` from the browser. A server-rendered auth check on the web origin would need either a shared parent domain (only possible once both apps move to a shared parent) or a Next.js Route Handler proxy — both deferred. Local dev runs the api on `localhost:3001` against the docker-compose Postgres, not against Render.
- Tests exist for design-system components, `useForm`, the login form, the dashboard page, and `AuthService` + `SessionService`.

### Phase 1 scope (planned — not yet implemented)

When these modules are added, the rules below apply. Do not build any of this speculatively; only implement the pieces an explicit ticket calls for.

- **Frontend** (`apps/web`): dashboard, activities list, activity detail, calendar, insights, settings.
- **Backend** (`apps/api`) NestJS — modules under `src/modules/`:
  - `athletes/` (profile + `AthleteSettings.weekStartDay`)
  - `activities/` (CRUD + listing, grouped by week)
  - `trimp/formulas/` (versioned, e.g. `banister-v1.ts`)
  - `sync/providers/` (Strava, COROS)
  - `weekly-load/` (aggregation)
  - `coach-brain/` — **inert stub only.** No real coaching logic in Phase 1.
- **DB**: PostgreSQL + Prisma (pgvector reserved for future Coach Brain embeddings — not used in Phase 1 queries).
- **Jobs/Queue**: BullMQ + Redis for sync jobs.
- **Hosting**: Vercel (web); Render (api + Postgres). BullMQ + Redis when sync lands, likely a Render Background Worker rather than the api Web Service. Local dev: docker-compose Postgres on port 5433.

**Out of scope — flag, don't build**: AI coaching / Coach Brain logic beyond the inert stub, automated training plan generation, injury prediction, nutrition/recovery modeling, multi-sport optimization.

## Stack

- **Monorepo**: Turborepo 2 + pnpm 11 workspaces, Node >= 24
- **Backend**: `apps/api` — NestJS 11, TypeScript 6, ESLint 10, compiles to **CommonJS**
- **Frontend**: `apps/web` — Next.js 16 (App Router), React 19, TypeScript 6, `moduleResolution: "bundler"`
- **Web state**: zustand (UI state, e.g. `auth-ui-store`); custom **Forms Provider** for form state (multiple named forms per provider, zustand-backed) — see `apps/web/src/forms/`
- **Web validation**: zod schemas co-located with forms (e.g. `apps/web/src/app/login/schemas.ts`)
- **Web API access**: `apps/web/src/lib/api-client.ts` — fetch wrapper; reads `NEXT_PUBLIC_API_URL` (defaults `http://localhost:3001`)
- **Design system**: `@vecta/design-system` — see below
- **Shared types**: `@vecta/shared-types` — TS source, consumed directly (no build step)
- **Lint/format**: ESLint via `@vecta/eslint-config` (extends `eslint-config-love` + `eslint-config-prettier`); Prettier for formatting
- **Tests**: Vitest + `@testing-library/react` + jsdom, in `apps/web` and `packages/design-system`. API uses Vitest in `node` env (no jsdom). Run without starting the Next dev server.

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
- **Theme switching**: `apps/web/src/app/theme-script.tsx` sets `data-theme` + `data-color-scheme` on `<html>` from `prefers-color-scheme`. Light/dark are CSS-layer overrides in `packages/design-system/src/themes/{light,dark}.css`, not React state.

## Commands

```bash
pnpm install
pnpm dev            # turbo run dev — api on :3001, web on :3000
pnpm build          # turbo run build
pnpm lint           # turbo run lint
pnpm test           # turbo run test (api, web, DS)
pnpm format         # prettier --write .
pnpm format:check   # prettier --check .

# Per-package
pnpm --filter @vecta/api db:up              # docker compose up -d postgres
pnpm --filter @vecta/api prisma:migrate     # apply schema to local DB
pnpm --filter @vecta/api start:dev          # nest start --watch
pnpm --filter @vecta/api test               # vitest run (api)
pnpm --filter @vecta/web dev                # next dev
pnpm --filter @vecta/web test               # vitest run (web)
pnpm --filter @vecta/web lint:fix           # eslint . --fix
pnpm --filter @vecta/design-system test     # vitest run (DS)
pnpm --filter @vecta/design-system storybook # DS docs on :6006
```

> Turbo `lint` and `test` declare `dependsOn: ["^build"]` (`turbo.json`), so a single-package lint or test still builds every workspace package first.

## Release & PR workflow

- **PR titles** must follow Conventional Commits. Allowed types (enforced by `.github/workflows/pr-title.yml`): `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`.
- **Opened PRs auto-flip to draft** via `.github/workflows/default-draft.yml`. Mark the PR ready for review only when it's actually ready.
- **Releases** run via `semantic-release` on push to `main` (`.releaserc.json` → `branches: ["main"]`). Don't hand-bump versions; the release commit is generated.
- **Branches**: `main` is always releasable. It only contains finished work. Features should checkout from the most recent `main` and PR to that branch. No direct push to main are allowed.

## Conventions

- **TypeScript strict everywhere** (`tsconfig.base.json` has `strict: true`). No `any` without justification.
- **Module style differs per app.** `apps/api` compiles to CommonJS (`module: "commonjs"`); `apps/web` and `packages/design-system` use `moduleResolution: "bundler"`. Don't copy TS configs between them — it silently breaks the API build.
- **NestJS module layout** (when domain modules land): one folder per domain — `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`. Use NestJS DI; don't `new` services up.
- **Shared request/response shapes** go in `packages/shared-types`. Import from there in both apps — don't redefine the same interface in `apps/web` and `apps/api`.
- **Secrets**: OAuth provider tokens must be encrypted at rest. Never log raw tokens or payloads that contain them.
- **Tests**: Vitest + RTL, run under jsdom. Behavior tests, not implementation tests. Co-locate `*.test.ts(x)` next to the file under test.
- **Don't code outside the prompt.** Ask questions if anything is unclear before writing the first line of code.

## Things to know before building the next layer

These are guardrails so new code doesn't block Phase 1 work:

1. **Don't hardcode week boundaries** to Monday. When weekly aggregation lands it must respect `AthleteSettings.weekStartDay`; default Monday only when unset.
2. **TRIMP must tolerate missing HR.** When the formula lands, missing `avgHR` should store `trimpValue: null` and let the sync pipeline continue — never throw.
3. **TRIMP formula versioning.** When the formula lands, never edit `banister-v1.ts` in place. Add `banister-v2.ts` and a new `formulaVersion` value so v1 records stay reproducible.
4. **Idempotent sync.** When ingestion lands, dedupe on `(athleteId, provider, externalId)`.
5. **Coach Brain is a stub.** Do not add real coaching logic to `apps/api/src/modules/coach-brain/` until Phase 2.
6. **API client.** Add new endpoints to `apps/web/src/lib/api-client.ts`; don't open-code `fetch(...)` calls in components.
7. **Auth.** All new endpoints that touch athlete data must be guarded with `SessionGuard` (`apps/api/src/modules/auth/guards/session.guard.ts`). The browser sends the `vt_sid` cookie via `credentials: 'include'` — preserve that on every api call.
8. **Cross-origin auth.** The api origin (Render) issues the session cookie. Server components on the web origin (Vercel) can't read it via `next/headers`. When a server-rendered auth check is needed, either set the cookie with a `Domain=` that covers both origins (only possible if both apps move to a shared parent domain) or proxy the request through a Next.js Route Handler — do not switch the api origin to read the web domain's cookies.
