import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * The SPA runs on :5173 and talks to the API on :3001 during development, so
 * `/api` is proxied — that keeps the browser on a single origin and the session
 * cookie first-party even in development (spec-3 § 1.3).
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
