# AGENTS.md — VECTA Train

Guidance for AI coding agents working in this repo. Read this before making changes.

## Project

VECTA Train ingests wearable running data (Strava/COROS), computes Banister TRIMP per activity, aggregates weekly load, and shows it on a dashboard. Phase 1 is deterministic analytics only — auth, feature flags, and the first UI surfaces.

The full architecture, modules, and constraints are defined in [`docs/1-architecture/`](docs/1-architecture/prd.md). Start there: read the PRD, then pull whichever spec covers your ticket.

**Out of scope — flag, don't build:**

- AI coaching / Coach Brain logic (inert stub only)
- Automated training plan generation
- Injury prediction, nutrition/recovery modeling, multi-sport optimization

## Documentation workflow

Every new feature is documented as a PRD plus one or more specs:

```
docs/
  1-feature-title/
    prd.md
    spec-1-*.md
    spec-2-*.md
    ...
```

- `prd.md` covers *what* and *why* — problem, goals, non-goals, constraints. No packages, no files, no code.
- `spec-*.md` files cover *how* — concrete stack, module boundaries, code examples, file paths, and acceptance criteria for the implementing agent.

When you start a new feature, create `docs/N-feature-title/` and write the PRD **before** writing any code. Update specs as implementation decisions land.

## Stack

- pnpm workspaces; `client/` (Vite + React 19) and `server/` (Fastify + tRPC + Drizzle); Node 24 + PostgreSQL 18.
- Lint + format: Biome (single config). Boundary enforcement: dependency-cruiser.
- Tests: Vitest in both workspaces.

For pinned versions and rationale see [`spec-1-stack-and-foundation.md`](docs/1-architecture/spec-1-stack-and-foundation.md).

## Design system

Apply the `vecta-design-system` skill for any UI work — do not invent colors, fonts, or spacing. Tokens, themes, and components live in `client/src/ui/` and are consumed from source.

## Commands

```bash
pnpm install
pnpm dev                 # vite on :5173, fastify on :3001
pnpm build
pnpm lint                # biome + depcruise
pnpm test                # vitest across both workspaces
pnpm format              # biome format --write .

# Per-package
pnpm --filter server db:migrate             # drizzle-kit migrate
pnpm --filter server db:generate            # drizzle-kit generate
pnpm --filter server user:promote <email>   # grant admin
pnpm --filter client storybook              # DS docs on :6006
```

## Release & PR workflow

- **PR titles** must follow Conventional Commits. Allowed types (enforced by `.github/workflows/pr-title.yml`): `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`.
- **Opened PRs auto-flip to draft** via `.github/workflows/default-draft.yml`. Mark the PR ready for review only when it's actually ready.
- **Releases** run via `semantic-release` on push to `main` (`.releaserc.json` → `branches: ["main"]`). Don't hand-bump versions; the release commit is generated.
- **Branches**: `main` is always releasable. Features should checkout from the most recent `main` and PR to that branch. No direct pushes to `main`.

## Conventions

- **Don't commit without explicit authorization.** Stage the work, summarise what is about to be committed, and wait for the user to say "commit" (or equivalent) before running `git commit`. This applies to every commit, including docs-only changes and follow-up fixes; no commit is implicit.
- **TypeScript strict everywhere** (`tsconfig.base.json` has `strict: true`). No `any` without justification.
- **Layering is enforced mechanically** by dependency-cruiser. `domain` never imports `data`, `transport`, `db`, or any framework. See [`spec-1-stack-and-foundation.md`](docs/1-architecture/spec-1-stack-and-foundation.md) § "Boundary enforcement" for the full rule set.
- **Shared request/response shapes** go in a shared package. Don't redefine the same interface in `client/` and `server/`.
- **Secrets**: OAuth provider tokens must be encrypted at rest. Never log raw tokens or payloads that contain them.
- **Tests**: Vitest + RTL, run under jsdom. Behavior tests, not implementation tests. Co-locate `*.test.ts(x)` next to the file under test.
- **Don't code outside the prompt.** Ask questions if anything is unclear before writing the first line of code.

## Things to know before building the next layer

These are guardrails so new code doesn't block later work. They are also encoded as constraints in [`prd.md`](docs/1-architecture/prd.md):

1. **Don't hardcode week boundaries** to Monday. When weekly aggregation lands it must respect `AthleteSettings.weekStartDay`; default Monday only when unset.
2. **TRIMP must tolerate missing HR.** When the formula lands, missing `avgHR` should store `trimpValue: null` and let the sync pipeline continue — never throw.
3. **TRIMP formula versioning.** When the formula lands, never edit `banister-v1.ts` in place. Add `banister-v2.ts` and a new `formulaVersion` so v1 records stay reproducible.
4. **Idempotent sync.** When ingestion lands, dedupe on `(athleteId, provider, externalId)`.
5. **Coach Brain is a stub.** Do not add real coaching logic until Phase 2.
6. **API access.** All requests go through the tRPC client in `client/src/trpc.ts`; don't open-code `fetch(...)` calls in components.
7. **Auth.** All procedures that touch athlete data must be guarded with `protectedProcedure` or `adminProcedure`. The browser sends the `vt_sid` cookie via `credentials: 'include'` — preserve that on every api call.
8. **Same origin.** SPA and API share an origin in production (Vercel monolith). No CORS configuration in production; the session cookie is first-party.
