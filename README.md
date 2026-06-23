# VECTA Train — Starter Scaffold

Minimal monorepo skeleton, current stable versions (Jun 2026):
Next.js 16 / React 19, NestJS 11, TypeScript 6, Tailwind 4.

apps/
  api/   NestJS backend — one generic "items" CRUD example (in-memory, no DB yet)
  web/   Next.js frontend — home page + one generic page calling the API
packages/
  shared-types/   shared TS types

## Run
pnpm install
pnpm dev
- api: http://localhost:3001
- web: http://localhost:3000

DB (Postgres/Prisma), auth, and the real domain modules are intentionally
left out — add them once this base is confirmed running.
