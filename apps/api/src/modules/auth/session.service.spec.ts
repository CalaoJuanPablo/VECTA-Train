import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionService } from './session.service';

interface SessionRow {
  id: string;
  athleteId: string;
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
  athlete: unknown;
}

function buildPrismaStub(): PrismaStub {
  return {
    session: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn(), update: vi.fn() },
    athlete: {},
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

    await service.create('athlete-1');

    const call = prisma.session.create.mock.calls[0][0];
    expect(call.data.athleteId).toBe('athlete-1');
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

  it('findById returns the session and athlete when not expired', async () => {
    const future = new Date(Date.now() + 60_000);
    const athlete = { id: 'athlete-1' };
    prisma.session.findUnique.mockResolvedValueOnce({
      id: 'sid',
      athleteId: 'athlete-1',
      expiresAt: future,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      athlete,
    });

    const found = await service.findById('sid');
    expect(found).toEqual({
      session: expect.objectContaining({ id: 'sid', athleteId: 'athlete-1' }),
      athlete,
    });
    // Confirms the relation was included — catches a future regression where someone
    // forgets `include: { athlete: true }` and the wire-mapping blows up at runtime.
    expect(prisma.session.findUnique).toHaveBeenCalledWith({
      where: { id: 'sid' },
      include: { athlete: true },
    });
  });

  it('findById returns null and deletes the session when expired', async () => {
    prisma.session.findUnique.mockResolvedValueOnce({
      id: 'sid',
      athleteId: 'athlete-1',
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      lastUsedAt: new Date(),
      athlete: { id: 'athlete-1' },
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