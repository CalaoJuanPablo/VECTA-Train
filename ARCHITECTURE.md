# VECTA Train — Architecture

The architecture is documented in [`docs/1-architecture/`](docs/1-architecture/).

| File | Covers |
|---|---|
| [`prd.md`](docs/1-architecture/prd.md) | Goals, non-goals, constraints, target shape |
| [`spec-1-stack-and-foundation.md`](docs/1-architecture/spec-1-stack-and-foundation.md) | Stack, runtime, repo structure, layered architecture, boundary enforcement |
| [`spec-2-server-modules.md`](docs/1-architecture/spec-2-server-modules.md) | `auth` / `flags` / `health` modules, procedures, data model |
| [`spec-3-deployment.md`](docs/1-architecture/spec-3-deployment.md) | Local development, production deployment, feature flags |
| [`spec-4-client-architecture.md`](docs/1-architecture/spec-4-client-architecture.md) | Design system, forms, tRPC client |
| [`spec-5-tooling-and-testing.md`](docs/1-architecture/spec-5-tooling-and-testing.md) | Biome, dependency-cruiser, testing |
| [`spec-6-build-order.md`](docs/1-architecture/spec-6-build-order.md) | Build sequence |

Read the PRD first. Then pull the spec(s) that cover the ticket you're implementing.
