## What

- Auth endpoints: `POST /auth/sign-up`, `POST /auth/sign-in`, `POST /auth/sign-out`, `GET /auth/me`
- Sessions in Postgres via Prisma; opaque `vt_sid` cookie (httpOnly, SameSite=Lax, Secure-when-configured, 30-day TTL)
- Rate limiting via `@nestjs/throttler` (5 sign-up / 10 sign-in per IP per minute)
- Foundation entity renamed `User → Athlete` to match the Phase 1 `athletes/` plan

## Why

Auth is the entry point for every Phase 1 module (`activities/`, `weekly-load/`, `athletes/`, `trimp/`). A pre-merge security review found four issues that needed fixing before auth landed:

1. **User-enumeration timing oracle** — `argon2.verify` only ran when email existed; latency leaked email existence.
2. **No rate limiting** — `/auth/*` was brute-forceable.
3. **Lax `birthDate` validation** — server used `@IsDateString`; client zod enforced age 13–120. Direct API calls accepted anything.
4. **CORS fallback to localhost** — `WEB_ORIGIN` unset silently broke cross-origin cookies in production.

The `User → Athlete` rename aligns the schema with `AGENTS.md` Phase 1 before `activities/`, `AthleteSettings.weekStartDay`, etc. build on top.

## How

NestJS 11 + Prisma 6 + `@nestjs/throttler` 6 + argon2. Sessions keyed by 32-byte base64url; `Session.athleteId` FK with `onDelete: Cascade`. Validation via class-validator + global `ValidationPipe` (whitelist + forbidNonWhitelisted). Three manual conflict resolutions on cherry-pick from `feat/add-login-page`: `package.json`, `apps/api/src/main.ts`, `pnpm-lock.yaml`. `AGENTS.md` initially lost main's "deterministic analytics" guidance on conflict — restored in `3e1a56b`.

Wire format change: `{ user }` → `{ athlete }` on sign-up/sign-in/me responses. `apps/web/src/lib/api-client.ts` is the only contract point; PR #3 (web integration) destructures `athlete`.

Migration `20260713193556_rename_user_to_athlete` creates the `athletes` table on dev; `migration_lock.toml` is now tracked.

## Testing

- [x] 56 unit tests: 8 env guard + 28 SignUpDto + 7 SignInDto + 7 SessionService + 6 AuthService
- [x] `pnpm --filter @vecta/api lint` clean
- [x] `pnpm --filter @vecta/api build` clean
- [x] `prisma migrate dev --name rename_user_to_athlete` applied
- [x] Local manual testing process in `README.md` (Insomnia round-trip, validation matrix, rate-limit trip, prod-env guard)
- [ ] Preview-deploy verification on Render — pending

## Checklist

- [x] PR title follows Conventional Commits: `feat(api): add Postgres-backed auth with security hardening`
- [x] `size:exception` recorded — ~1100 lines, ~2.7× the 400-line budget. Justified: the security hardening, auth module, and User→Athlete rename touch the same files; splitting any of them would re-open the auth module in a follow-up PR.
- [x] No `Co-Authored-By` or AI attribution in any commit
- [x] `.env` is gitignored (no secrets in diff)
- [ ] Manual local smoke test against Postgres + Insomnia (steps in README)
- [ ] Code is ready for release