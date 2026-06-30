import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    server: {
      // DS is a workspace package (resolves under node_modules via symlink);
      // inline it so Vitest transforms its source TSX/CSS Modules.
      deps: { inline: [/@vecta\/design-system/] },
    },
  },
});
