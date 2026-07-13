import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { Athlete } from '@vecta/shared-types';
import { SESSION_COOKIE_NAME } from '../cookie.util';
import { SessionService } from '../session.service';

declare module 'express' {
  interface Request {
    /** Populated by SessionGuard when the session is valid. */
    athlete?: Athlete;
    sessionId?: string;
  }
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.cookies?.[SESSION_COOKIE_NAME];
    if (!sessionId) throw new UnauthorizedException();

    const found = await this.sessions.findById(sessionId);
    if (!found) throw new UnauthorizedException();

    request.sessionId = found.session.id;
    request.athlete = {
      id: found.athlete.id,
      email: found.athlete.email,
      firstName: found.athlete.firstName,
      lastName: found.athlete.lastName,
      birthDate: found.athlete.birthDate.toISOString().slice(0, 10),
    };
    return true;
  }
}
