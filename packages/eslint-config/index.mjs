import love from 'eslint-config-love';
import prettierConfig from 'eslint-config-prettier';

// eslint-config-love already wires up the TypeScript parser and projectService
// (auto-discovers the nearest tsconfig.json from each linted file). We extend
// its parserOptions so the project service tolerates JS/MJS files at the
// consumer's root (e.g. eslint.config.mjs, .storybook entry scripts) without
// forcing them into the TS project.
//
// `prettierConfig` is appended LAST so it disables any love formatting rules
// that would conflict with Prettier (e.g. comma-dangle, quote).
export default [
  {
    ...love,
    languageOptions: {
      ...love.languageOptions,
      parserOptions: {
        ...love.languageOptions.parserOptions,
        projectService: { allowDefaultProject: ['*.js', '*.mjs'] },
      },
    },
  },
  {
    ignores: [
      '**/storybook-static/**',
      '**/.turbo/**',
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      'next-env.d.ts',
    ],
  },
  prettierConfig,
];
