import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Session, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

/** Random, opaque session id used as the cookie value. 32 bytes → 256 bits. */
function generateSessionId(): string {
  return randomBytes(32).toString('base64url');
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string): Promise<Session> {
    const id = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    return this.prisma.session.create({ data: { id, userId, expiresAt } });
  }

  /** Returns the active session and its user, or null if missing/expired. */
  async findById(sessionId: string): Promise<{ session: Session; user: User } | null> {
    if (!sessionId) return null;
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
      // Expired — clean up best-effort and report missing to the caller.
      await this.prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
      return null;
    }
    return { session, user: session.user };
  }

  async revoke(sessionId: string): Promise<void> {
    if (!sessionId) return;
    await this.prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
  }

  async touch(sessionId: string): Promise<void> {
    if (!sessionId) return;
    await this.prisma.session
      .update({ where: { id: sessionId }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
  }
}