import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { assertProductionEnv } from './config/production-env.guard';

/** Exported for unit tests; main.ts only invokes it indirectly via bootstrap. */
export { assertProductionEnv };

async function bootstrap() {
  // Fail fast on missing/weak production config before opening sockets.
  assertProductionEnv();

  const app = await NestFactory.create(AppModule);

  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({
    origin: webOrigin,
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();