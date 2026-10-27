// Vitest setup for client tests: extends `expect` with jest-dom matchers
// (toBeInTheDocument, toHaveAccessibleName, ...). React Testing Library's
// automatic cleanup relies on Vitest `globals: true`, which is enabled in
// vitest.config.ts.
import '@testing-library/jest-dom/vitest';
