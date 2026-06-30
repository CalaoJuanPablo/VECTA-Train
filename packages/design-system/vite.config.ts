/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Shared config used by Vitest and Storybook. The library build lives in
// vite.lib.config.ts so its lib/dts options never leak into Storybook.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    css: true,
  },
});
