import love from 'eslint-config-love'

// eslint-config-love already wires up the TypeScript parser and projectService
// (auto-discovers the nearest tsconfig.json from each linted file). We extend
// its parserOptions so the project service tolerates JS/MJS files at the
// consumer's root (e.g. eslint.config.mjs, .storybook entry scripts) without
// forcing them into the TS project.
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
    ],
  },
]
