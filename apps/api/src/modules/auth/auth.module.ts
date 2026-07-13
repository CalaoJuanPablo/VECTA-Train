import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

/**
 * Rate-limit bucket applied to every /auth/* route. Default 10 req/min/IP is
 * a deliberate starting point — sign-up and sign-in apply stricter overrides
 * in {@link AuthController}.
 */
const AUTH_DEFAULT_LIMIT_MS = 60_000;
const AUTH_DEFAULT_LIMIT = 10;

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'default', ttl: AUTH_DEFAULT_LIMIT_MS, limit: AUTH_DEFAULT_LIMIT },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, SessionService],
  exports: [AuthService, SessionService],
})
export class AuthModule {}