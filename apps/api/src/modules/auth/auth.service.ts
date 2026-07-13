import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Athlete, SignInInput, SignUpInput } from '@vecta/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { toAthlete } from './dto/athlete.mapper';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly sessions: SessionService,
  ) {}

  async signUp(input: SignUpInput): Promise<{ athlete: Athlete; sessionId: string }> {
    const passwordHash = await this.password.hash(input.password);

    let athlete;
    try {
      athlete = await this.prisma.athlete.create({
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

    const session = await this.sessions.create(athlete.id);
    return { athlete: toAthlete(athlete), sessionId: session.id };
  }

  async signIn(input: SignInInput): Promise<{ athlete: Athlete; sessionId: string }> {
    const athlete = await this.prisma.athlete.findUnique({ where: { email: input.email } });
    // Always run argon2.verify (with a dummy hash when the athlete is unknown) so
    // signIn latency is independent of email existence — prevents user enumeration
    // via timing oracle. The response message stays generic on top of that.
    const hashToCheck = athlete?.passwordHash ?? (await this.password.getDummyHash());
    const passwordValid = await this.password.verify(hashToCheck, input.password);
    if (!athlete || !passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const session = await this.sessions.create(athlete.id);
    return { athlete: toAthlete(athlete), sessionId: session.id };
  }
}