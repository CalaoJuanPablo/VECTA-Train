import fastifyCors from '@fastify/cors';
import { type FastifyTRPCPluginOptions, fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import fastify from 'fastify';
import { type AppRouter, appRouter } from './router.ts';

// Load `.env` if present (Node 24 native loader, no extra dependency).
// Already-exported environment variables always win.
try {
  process.loadEnvFile();
} catch {
  // no .env file — the environment is supplied externally
}

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = '0.0.0.0';
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

const server = fastify({
  routerOptions: {
    maxParamLength: 5000,
  },
});

await server.register(fastifyCors, {
  origin: CORS_ORIGINS,
});

server.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext: () => ({}),
    onError({ path, error }) {
      console.error(`Error in tRPC handler on path '${path}':`, error);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});

(async () => {
  try {
    await server.listen({
      port: process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT,
      host: process.env.HOST || DEFAULT_HOST,
    });

    const address = server.server.address();

    if (typeof address === 'string') {
      console.log(`Server listening on ${address}`);
    } else {
      console.log(`Server listening on ${address?.address}:${address?.port}`);
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
})();
