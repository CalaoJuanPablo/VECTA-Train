import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SignInInput, SignUpInput } from '@vecta/shared-types';
import { AuthService } from './auth.service';

const FIXED_DATE = new Date('1990-05-01T00:00:00.000Z');

function buildPasswordService() {
  return {
    hash: vi.fn(async (plain: string) => `hashed:${plain}`),
    verify: vi.fn(async (_hash: string, plain: string) => plain === 'password1'),
    getDummyHash: vi.fn(async () => 'dummy-hash-equalizer'),
  };
}

function buildSessionService() {
  return {
    create: vi.fn(async (userId: string) => ({
      id: `sid-${userId}`,
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      createdAt: new Date(),
      lastUsedAt: new Date(),
    })),
    findById: vi.fn(),
    revoke: vi.fn(),
    touch: vi.fn(),
  };
}

interface PrismaStub {
  user: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  session: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
}

function buildPrismaStub(): PrismaStub {
  return {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe('AuthService', () => {
  let prisma: PrismaStub;
  let password: ReturnType<typeof buildPasswordService>;
  let sessions: ReturnType<typeof buildSessionService>;
  let service: AuthService;

  beforeEach(() => {
    prisma = buildPrismaStub();
    password = buildPasswordService();
    sessions = buildSessionService();
    service = new AuthService(prisma as never, password as never, sessions as never);
  });

  const validSignUp: SignUpInput = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    password: 'password1',
    birthDate: '1990-05-01',
  };

  describe('signUp', () => {
    it('hashes the password, creates a user, and opens a session', async () => {
      prisma.user.create.mockResolvedValueOnce({
        id: 'user-1',
        email: validSignUp.email,
        firstName: validSignUp.firstName,
        lastName: validSignUp.lastName,
        birthDate: FIXED_DATE,
        passwordHash: 'hashed:password1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.signUp(validSignUp);

      expect(password.hash).toHaveBeenCalledWith('password1');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          birthDate: FIXED_DATE,
          passwordHash: 'hashed:password1',
        },
      });
      expect(sessions.create).toHaveBeenCalledWith('user-1');
      expect(result.user).toEqual({
        id: 'user-1',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        birthDate: '1990-05-01',
      });
      expect(result.sessionId).toBe('sid-user-1');
    });

    it('translates Prisma P2002 (unique email) into ConflictException', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: 'test' },
      );
      prisma.user.create.mockRejectedValueOnce(prismaError);

      await expect(service.signUp(validSignUp)).rejects.toBeInstanceOf(ConflictException);
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('rethrows non-unique-constraint Prisma errors', async () => {
      const otherError = new Error('connection refused');
      prisma.user.create.mockRejectedValueOnce(otherError);

      await expect(service.signUp(validSignUp)).rejects.toBe(otherError);
    });
  });

  describe('signIn', () => {
    const signIn: SignInInput = { email: 'jane@example.com', password: 'password1' };

    it('returns the user and a new session id on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: signIn.email,
        firstName: 'Jane',
        lastName: 'Doe',
        birthDate: FIXED_DATE,
        passwordHash: 'hashed:password1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.signIn(signIn);

      expect(password.verify).toHaveBeenCalledWith('hashed:password1', 'password1');
      expect(result.user.id).toBe('user-1');
      expect(result.sessionId).toBe('sid-user-1');
    });

    it('throws UnauthorizedException with a generic message when the email is unknown', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.signIn(signIn)).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(service.signIn(signIn)).rejects.toMatchObject({
        message: 'Invalid email or password',
      });
      // Timing-safe path: verify IS still called against a dummy hash so the
      // signIn latency is independent of whether the email exists.
      expect(password.getDummyHash).toHaveBeenCalled();
      expect(password.verify).toHaveBeenCalledWith('dummy-hash-equalizer', 'password1');
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException with the same generic message on wrong password', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: signIn.email,
        firstName: 'Jane',
        lastName: 'Doe',
        birthDate: FIXED_DATE,
        passwordHash: 'hashed:something-else',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.signIn({ email: signIn.email, password: 'wrongpass1' }),
      ).rejects.toMatchObject({
        message: 'Invalid email or password',
      });
      expect(sessions.create).not.toHaveBeenCalled();
    });
  });
});