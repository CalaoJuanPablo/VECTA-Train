# Spec 5 — Tooling and testing

How lint, format, boundary enforcement, and tests are wired.

## 1. Biome

Single configuration (`biome.json`) covering linting, formatting, and import organisation. Recommended rule set plus the `react` domain.

Biome does not type-check. `tsc --noEmit` runs as a separate step. Biome's type-aware rules require the `project` domain, which activates full project scanning; it is enabled only once the build is stable.

The formatter's output differs slightly from Prettier's. Running `pnpm format` normalises formatting across the repository.

## 2. dependency-cruiser

Owns boundary enforcement — see [`spec-1-stack-and-foundation.md`](spec-1-stack-and-foundation.md) § "Boundary enforcement" — and runs as part of `pnpm lint`.

## 3. Testing

Vitest in both workspaces. Client tests run under jsdom with Testing Library; server tests run in a Node environment against in-memory fakes for domain logic and the container database for data integration.

Domain tests assert behaviour through public interfaces and use no mocking framework.
