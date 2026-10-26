import { defineConfig } from 'drizzle-kit';

// Load `.env` if present (Node 24 native loader, no extra dependency).
// Already-exported environment variables always win.
try {
  process.loadEnvFile();
} catch {
  // no .env file — the environment is supplied externally
}

const url = process.env.DATABASE_URL ?? 'postgresql://vecta:vecta@localhost:5433/vecta';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
