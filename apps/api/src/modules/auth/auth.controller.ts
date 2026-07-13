import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { AuthResponse } from '@vecta/shared-types';
import { AuthService } from './auth.service';
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  readCookieConfig,
  setSessionCookie,
} from './cookie.util';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { SessionGuard } from './guards/session.guard';
import { SessionService } from './session.service';

/**
 * Stricter per-route overrides on top of the {@link AuthModule} default
 * (10 req/min/IP). Sign-up is the cheapest account-creation surface, so it
 * gets the tightest ceiling. Sign-in gets a slightly looser one to keep
 * legitimate retry-typo flows snappy. /me and sign-out inherit the module
 * default — sign-out is already idempotent and /me is auth-gated.
 */
const SIGN_UP_LIMIT = 5;
const SIGN_IN_LIMIT = 10;

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: SIGN_UP_LIMIT, ttl: 60_000 } })
  async signUp(
    @Body() body: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const { athlete, sessionId } = await this.auth.signUp(body);
    setSessionCookie(res, sessionId, readCookieConfig());
    return { athlete };
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: SIGN_IN_LIMIT, ttl: 60_000 } })
  async signIn(
    @Body() body: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const { athlete, sessionId } = await this.auth.signIn(body);
    setSessionCookie(res, sessionId, readCookieConfig());
    return { athlete };
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    await this.sessions.revoke(sessionId);
    clearSessionCookie(res, readCookieConfig());
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@Req() req: Request): AuthResponse {
    return { athlete: req.athlete! };
  }
}