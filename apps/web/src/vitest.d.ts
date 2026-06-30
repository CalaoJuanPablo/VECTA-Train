// Registers the @testing-library/jest-dom matchers (toBeInTheDocument, etc.)
// on Vitest's expect types so `tsc --noEmit` type-checks the test files.
import '@testing-library/jest-dom/vitest';
