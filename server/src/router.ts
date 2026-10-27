import { initTRPC } from '@trpc/server';

export const t = initTRPC.create();

export const appRouter = t.router({
  getHello: t.procedure.query(() => {
    return 'Hello from tRPC!';
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
