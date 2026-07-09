import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser, SignInInput, SignUpInput } from '@vecta/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { toAuthUser } from './dto/auth-user.mapper';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly sessions: SessionService,
  ) {}

  async signUp(input: SignUpInput): Promise<{ user: AuthUser; sessionId: string }> {
    const passwordHash = await this.password.hash(input.password);

    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          birthDate: new Date(input.birthDate),
          passwordHash,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }

    const session = await this.sessions.create(user.id);
    return { user: toAuthUser(user), sessionId: session.id };
  }

  async signIn(input: SignInInput): Promise<{ user: AuthUser; sessionId: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    // Always run argon2.verify (with a dummy hash when the user is unknown) so
    // signIn latency is independent of email existence — prevents user enumeration
    // via timing oracle. The response message stays generic on top of that.
    const hashToCheck = user?.passwordHash ?? (await this.password.getDummyHash());
    const passwordValid = await this.password.verify(hashToCheck, input.password);
    if (!user || !passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const session = await this.sessions.create(user.id);
    return { user: toAuthUser(user), sessionId: session.id };
  }
}