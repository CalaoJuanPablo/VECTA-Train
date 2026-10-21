# Spec 1 — Stack, runtime, repository structure, and layered architecture

Everything that defines the substrate. Picking a new package, setting up a workspace, or wiring a new module should not require reading any other spec.

## 1. Runtime

| | |
|---|---|
| Node.js | **24.x LTS** (`node:24-alpine`). `engines: ">=24"` |
| Package manager | pnpm workspaces, 2 packages |
| Database | PostgreSQL **18** |

Versions are pinned at build time and re-verified against the npm registry.

## 2. Server packages

| Package | Version | Role |
|---|---|---|
| `fastify` | 5.x | HTTP server. **v5 required** — v4 returns empty responses against tRPC v11. |
| `@fastify/cookie` | 11.x | Session cookie. |
| `@fastify/cors` | 11.x | **Development only** — Vite and API differ by port locally. |
| `@trpc/server` | 11.x | Typed RPC. |
| `drizzle-orm` | 0.45.x | Query builder. |
| `drizzle-kit` | 0.31.x | Migrations. |
| `pg` | 8.x | Postgres driver. |
| `zod` | 4.x | Input validation. |
| `argon2` | 0.45.x | Password hashing. |
| `tsx` | 4.x | Dev runner with file watching. |
| `vitest` | 5.x | Tests. |

`@fastify/static` is **not** used — Vercel serves static assets (see `spec-3-deployment.md`).

## 3. Client packages

| Package | Version | Role |
|---|---|---|
| `react` / `react-dom` | 19.x | UI. |
| `react-router` | 8.x | Client-side routing. |
| `vite` | 8.x | Dev server and bundler. |
| `@vitejs/plugin-react` | 6.x | React transform. |
| `@trpc/client`, `@trpc/react-query` | 11.x | Typed API client. |
| `@tanstack/react-query` | 5.x | Required by `@trpc/react-query`. |
| `superjson` | 2.x | Wire serialization (`Date`, `undefined`). |
| `zustand` | 5.x | UI and form state. |
| `@storybook/react-vite` | 10.x | Component documentation. |

## 4. Tooling packages

| Package | Version | Role |
|---|---|---|
| `@biomejs/biome` | 2.6.x | Lint + format + import organisation. |
| `dependency-cruiser` | 18.x | Layer and module boundary enforcement. |
| `typescript` | 7.x | Types. |
| `@testing-library/react`, `jsdom`, `@testing-library/jest-dom` | latest | Client tests. |

## 5. Repository structure

```
vecta-train/
├── package.json              # private; workspaces: ["client", "server"]
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── biome.json
├── .dependency-cruiser.js
├── docker-compose.yml        # postgres service only (§ spec-3-deployment.md)
├── vercel.json               # SPA + /api routing (§ spec-3-deployment.md)
├── .env.example
├── AGENTS.md
├── README.md
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   ├── drizzle/              # generated SQL migrations (committed)
│   └── src/
│       ├── index.ts          # entry: env guard, build app, start
│       ├── app.ts            # Fastify factory, injectable for tests
│       ├── env.ts            # zod-validated environment
│       ├── db/
│       │   ├── client.ts     # pg Pool + drizzle()
│       │   └── schema.ts     # tables
│       ├── trpc/
│       │   ├── trpc.ts       # initTRPC, public/protected/admin procedures
│       │   ├── context.ts    # composition root
│       │   └── root.ts       # appRouter
│       ├── plugins/
│       │   └── session.ts
│       ├── shared/           # errors, id generation
│       └── modules/
│           ├── auth/
│           │   ├── transport/    router.ts, schemas.ts
│           │   ├── domain/       auth.service.ts, entities.ts, ports.ts
│           │   └── data/         athlete.repository.ts, session.repository.ts,
│           │                     argon2.password-hasher.ts, mappers.ts
│           ├── flags/
│           │   ├── transport/    router.ts
│           │   ├── domain/       flag.service.ts, evaluator.ts
│           │   └── data/         flag.repository.ts
│           └── health/
│               └── transport/    router.ts
│
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    ├── .storybook/
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── trpc.ts
        ├── theme-script.tsx
        ├── ui/               # design system
        │   ├── layers.css, reset.css, tokens.css, breakpoints.css, themes.css
        │   ├── tokens/  themes/
        │   └── components/
        │       ├── atoms/    Button, TextLink
        │       └── molecules/Fields/  Field, TextField, EmailField,
        │                                 PasswordField, DateField
        ├── forms/            # FormsProvider, useForm, forms-store
        └── features/
            ├── auth/         # login page, form, auth-ui-store
            └── dashboard/    # dashboard page
```

## 6. Layered architecture

Each module contains up to three sub-layers. Dependencies point **inward only**.

```
   transport  ───────────►  domain  ◄───────────  data
   (tRPC, zod,          (services, entities,   (Drizzle repositories,
    HTTP concerns)       repository ports)      mappers)
```

**`domain` depends on nothing** — no Fastify, no `@trpc/server`, no Drizzle, no `pg`.

### 6.1 Transport

Owns everything RPC-shaped. Contains no business logic.

- `transport/router.ts` — tRPC procedures
- `transport/schemas.ts` — zod input validation
- May import: `domain/`, `trpc/`, `shared/`
- Must not import: `data/`, `db/`, `drizzle-orm`, `pg`, `fastify`

A procedure validates input, calls one domain service, and maps domain errors to `TRPCError`. Business branching does not belong here.

### 6.2 Domain

The centre of the module. Plain TypeScript.

- `domain/*.service.ts` — business operations
- `domain/entities.ts` — types and invariants
- `domain/ports.ts` — repository and service **interfaces**, implemented in `data/`
- May import: `shared/` only

```ts
// domain/ports.ts
export interface AthleteRepository {
  findByEmail(email: string): Promise<Athlete | null>;
  create(input: NewAthlete): Promise<Athlete>;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
  dummyHash(): Promise<string>;
}
```

Domain services are unit-tested with in-memory fakes of these interfaces — no database, no framework, no mocking library.

### 6.3 Data

- `data/*.repository.ts` — implements the domain ports with Drizzle.
- `data/mappers.ts` — Drizzle row ↔ domain entity translation.
- Owns SQL, the `pg` pool, connection lifecycle.
- May import: `domain/`, `db/`
- Must not import: `transport/`

**Mappers are the leak barrier.** Drizzle infers row types where dates are `Date` objects. Domain entities use different representations — `Athlete.birthDate` is a `string` (`YYYY-MM-DD`), not a `Date`. That translation exists in `data/mappers.ts` and nowhere else, so a driver-level type change cannot propagate into business logic.

`feature_flags.allowlist` is a Postgres `text[]`; the domain sees `readonly string[]`. Column types never appear above the data layer.

## 7. Cross-module access

Modules do not import each other's internals. When `flags` needs auth state, it depends on an interface exposed by `auth/domain` — never on `auth/data`.

Shared primitives (errors, id generation) live in `src/shared/`. Feature logic does not.

## 8. Composition root

There is no DI container. Concrete classes are constructed in exactly one file, `server/src/trpc/context.ts`, and exposed on the tRPC context as `services`.

```ts
const pool = createPool(env.DATABASE_URL);
const db = drizzle(pool, { schema });

const services = {
  auth: new AuthService(
    new DrizzleAthleteRepository(db),
    new DrizzleSessionRepository(db),
    new Argon2PasswordHasher(),
  ),
  flags: new FlagService(new DrizzleFlagRepository(db), { ttlMs: 60_000 }),
};
```

Every other file depends on interfaces. Replacing the persistence layer touches this file and `data/` — nothing else.

## 9. Boundary enforcement

Enforced by **dependency-cruiser** in `pnpm lint`. Violations fail the build with the offending import path.

| From | Forbidden imports |
|---|---|
| `domain` | `transport`, `data`, `db`, `trpc`, `fastify`, `@trpc/*`, `drizzle-orm`, `pg` |
| `data` | `transport` |
| `shared` | `transport`, `data`, `db`, `trpc` |

dependency-cruiser rather than Biome for this: Biome's `noPrivateImports` operates on JSDoc symbol visibility (`@private` / `@package`) rather than directory boundaries, exempts `node_modules` and non-JS imports, and does not analyse `require()` or dynamic `import()`. It cannot express `domain → data`.

`noImportCycles` is enabled in Biome as well — cycles between layers are defects regardless of which tool reports them.

**Layers are applied where a module earns them.** `auth` and `flags` are layered. `health` is a single transport file with no domain logic.
