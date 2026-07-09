import type { User } from '@prisma/client';
import type { AuthUser } from '@vecta/shared-types';

/** Maps the Prisma row to the wire-format AuthUser (birthDate as YYYY-MM-DD). */
export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    birthDate: user.birthDate.toISOString().slice(0, 10),
  };
}