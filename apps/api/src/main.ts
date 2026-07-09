import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { assertProductionEnv } from './config/production-env.guard';

/** Exported for unit tests; main.ts only invokes it indirectly via bootstrap. */
export { assertProductionEnv };

async function bootstrap() {
  // Fail fast on missing/weak production config before opening sockets.
  assertProductionEnv();

  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();