import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionService } from './session.service';

interface SessionRow {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
}

interface PrismaStub {
  session: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  user: unknown;
}

function buildPrismaStub(): PrismaStub {
  return {
    session: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn(), update: vi.fn() },
    user: {},
  };
}

describe('SessionService', () => {
  let prisma: PrismaStub;
  let service: SessionService;

  beforeEach(() => {
    prisma = buildPrismaStub();
    service = new SessionService(prisma as never);
  });

  it('creates a session with a 30-day expiry and a base64url id', async () => {
    prisma.session.create.mockResolvedValueOnce({} as SessionRow);

    await service.create('user-1');

    const call = prisma.session.create.mock.calls[0][0];
    expect(call.data.userId).toBe('user-1');
    expect(call.data.id).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(call.data.id.length).toBeGreaterThanOrEqual(40);
    const thirtyDays = 1000 * 60 * 60 * 24 * 30;
    const skew = Math.abs(call.data.expiresAt.getTime() - (Date.now() + thirtyDays));
    expect(skew).toBeLessThan(5_000);
  });

  it('findById returns null for an empty id', async () => {
    expect(await service.findById('')).toBeNull();
    expect(prisma.session.findUnique).not.toHaveBeenCalled();
  });

  it('findById returns null when no session exists', async () => {
    prisma.session.findUnique.mockResolvedValueOnce(null);
    expect(await service.findById('missing')).toBeNull();
  });

  it('findById returns the session and user when not expired', async () => {
    const future = new Date(Date.now() + 60_000);
    const user = { id: 'user-1' };
    prisma.session.findUnique.mockResolvedValueOnce({
      id: 'sid',
      userId: 'user-1',
      expiresAt: future,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      user,
    });

    const found = await service.findById('sid');
    expect(found).toEqual({
      session: expect.objectContaining({ id: 'sid', userId: 'user-1' }),
      user,
    });
  });

  it('findById returns null and deletes the session when expired', async () => {
    prisma.session.findUnique.mockResolvedValueOnce({
      id: 'sid',
      userId: 'user-1',
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      lastUsedAt: new Date(),
      user: { id: 'user-1' },
    });
    prisma.session.delete.mockResolvedValueOnce(undefined);

    expect(await service.findById('sid')).toBeNull();
    expect(prisma.session.delete).toHaveBeenCalledWith({ where: { id: 'sid' } });
  });

  it('revoke is a no-op for empty ids', async () => {
    await service.revoke('');
    expect(prisma.session.delete).not.toHaveBeenCalled();
  });

  it('revoke swallows not-found errors so sign-out is idempotent', async () => {
    prisma.session.delete.mockRejectedValueOnce(new Error('not found'));
    await expect(service.revoke('sid')).resolves.toBeUndefined();
  });
});