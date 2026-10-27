/**
 * Boundary enforcement. Run as part of `pnpm lint`; a violation fails the build.
 *
 * Dependencies point inward only:
 *
 *   transport ──► domain ◄── data
 *
 * `domain` depends on nothing but `shared/`.
 *
 * dependency-cruiser (not Biome) owns this because Biome's `noPrivateImports`
 * operates on JSDoc symbol visibility rather than directory boundaries, exempts
 * node_modules and non-JS imports, and does not analyse `require()` / dynamic
 * `import()`. It cannot express `domain → data`.
 *
 * Patterns below are unanchored on purpose: the CLI is invoked with
 * `depcruise server/src client/src`, so rule paths must match regardless of
 * whether depcruise reports them relative to the CWD or to the scanned folder.
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */

/**
 * Packages `domain` may not reach for, however they resolve. Matched against the
 * resolved module path so it works with pnpm's nested store as well as a flat
 * `node_modules`.
 */
const FRAMEWORK_PACKAGES =
  '(^|/)node_modules/(fastify|@fastify\\/cookie|@fastify\\/cors|@vercel\\/node|@trpc\\/server|@trpc\\/client|drizzle-orm|drizzle-kit|pg|postgres|argon2|zod)(/|$)';

const TRANSPORT_PACKAGES =
  '(^|/)node_modules/(fastify|@fastify\\/cookie|@fastify\\/cors|@trpc\\/server)(/|$)';

export default {
  forbidden: [
    // Cycles between layers are defects regardless of which tool reports them.
    // Biome's noImportCycles is NOT enabled — it lives in Biome's `project`
    // domain, which stays off.
    {
      name: 'no-circular',
      comment: 'Circular dependency — layers must point inward only.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },

    // ---- domain -------------------------------------------------------------------------------
    {
      name: 'domain-not-to-transport',
      comment: 'Domain is transport-agnostic: it must not know about RPC.',
      severity: 'error',
      from: { path: 'modules/[^/]+/domain' },
      to: { path: 'modules/[^/]+/transport' },
    },
    {
      name: 'domain-not-to-data',
      comment: 'Domain declares repository ports; data implements them.',
      severity: 'error',
      from: { path: 'modules/[^/]+/domain' },
      to: { path: 'modules/[^/]+/data' },
    },
    {
      name: 'domain-not-to-infrastructure',
      comment: 'Domain must not reach for db/, trpc/ or plugins/ directly.',
      severity: 'error',
      from: { path: 'modules/[^/]+/domain' },
      to: { path: '(^|/)(src/)?(db|trpc|plugins)(/|$)' },
    },
    {
      name: 'domain-not-to-frameworks',
      comment: 'Domain is plain TypeScript — no Fastify, tRPC, Drizzle or pg.',
      severity: 'error',
      from: { path: 'modules/[^/]+/domain' },
      to: { path: FRAMEWORK_PACKAGES },
    },

    // ---- data ---------------------------------------------------------------------------------
    {
      name: 'data-not-to-transport',
      comment: 'Persistence knows nothing about RPC.',
      severity: 'error',
      from: { path: 'modules/[^/]+/data' },
      to: { path: 'modules/[^/]+/transport' },
    },
    {
      name: 'data-not-to-transport-frameworks',
      comment: 'Data owns SQL and the pool, not the transport framework.',
      severity: 'error',
      from: { path: 'modules/[^/]+/data' },
      to: { path: TRANSPORT_PACKAGES },
    },

    // ---- shared -------------------------------------------------------------------------------
    {
      name: 'shared-not-to-modules-or-infrastructure',
      comment: 'Shared primitives (errors, ids) stay leaf-ish.',
      severity: 'error',
      from: { path: 'modules/[^/]+/domain|/src/shared' },
      to: {
        path: [
          'modules/[^/]+/transport',
          'modules/[^/]+/data',
          '(^|/)(src/)?(db|trpc|plugins)(/|$)',
        ],
      },
    },

    // ---- cross-module -------------------------------------------------------------------------
    {
      name: 'modules-not-to-other-module-internals',
      comment:
        "Modules collaborate through another module's domain interfaces, never through its data or transport. `$1` keeps same-module edges legal.",
      severity: 'error',
      from: { path: 'modules/([^/]+)/(transport|data)' },
      to: {
        path: 'modules/[^/]+/(data|transport)',
        pathNot: 'modules/$1/',
      },
    },
  ],

  options: {
    // swc parses TypeScript without needing the compiler's JS API, which the
    // native TypeScript 7 port no longer exposes.
    parser: 'swc',
    // Dependencies into node_modules are recorded — the framework rules below
    // match on them — but never followed.
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)dist/|(^|/)drizzle/' },
    tsConfig: {
      fileName: 'server/tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      mainFields: ['module', 'main'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/(@[^/]+/[^/]+|[^/]+)',
      },
    },
  },
};
