#!/usr/bin/env node
/**
 * Enforces explicit extensions on relative imports in `server/src`.
 *
 * Vercel compiles the server file by file and runs the output as ESM, so every
 * relative specifier must name the file Node actually loads. `./router.ts` is
 * correct: TypeScript rewrites it to `./router.js` on emit
 * (`rewriteRelativeImportExtensions`). `./router` is not — it typechecks and
 * then crashes the deployed function with ERR_MODULE_NOT_FOUND.
 *
 * Aliases cannot be used here either: `paths` is typecheck-only, while Node
 * receives the specifier verbatim. Only relative imports are checked; bare
 * package specifiers and `node:` builtins resolve without an extension.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../server/src', import.meta.url));
const ALLOWED_EXTENSION = /\.(ts|json)$/;

const SPECIFIER_PATTERNS = [
  /\bfrom\s*['"]([^'"]+)['"]/g, // import … from, export … from
  /\bimport\s*['"]([^'"]+)['"]/g, // side-effect import
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // dynamic import
];

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.name.endsWith('.ts')) yield path;
  }
}

const failures = [];
let checked = 0;

for await (const file of walk(SRC)) {
  checked += 1;
  const source = await readFile(file, 'utf8');

  for (const pattern of SPECIFIER_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      const line = source.slice(0, match.index).split('\n').length;
      const filePath = relative(process.cwd(), file);

      if (specifier.startsWith('@vecta/')) {
        failures.push(`${filePath}:${line}  '${specifier}' → use a relative '.ts' import`);
        continue;
      }

      if (!specifier.startsWith('.') || ALLOWED_EXTENSION.test(specifier)) continue;

      failures.push(`${filePath}:${line}  '${specifier}' → '${specifier}.ts'`);
    }
  }
}

if (failures.length > 0) {
  console.error('Server runtime imports must be relative and include the .ts extension:');
  console.error('their specifier is emitted verbatim and resolved by Node, not bundled.\n');
  for (const failure of failures.sort()) console.error(`  ${failure}`);
  console.error(`\n${failures.length} problem(s) in ${checked} file(s).`);
  process.exit(1);
}

console.log(`Relative import extensions OK (${checked} files checked).`);
