import type { Athlete as PrismaAthlete } from '@prisma/client';
import type { Athlete as WireAthlete } from '@vecta/shared-types';

/** Maps the Prisma row to the wire-format Athlete (birthDate as YYYY-MM-DD). */
export function toAthlete(athlete: PrismaAthlete): WireAthlete {
  return {
    id: athlete.id,
    email: athlete.email,
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    birthDate: athlete.birthDate.toISOString().slice(0, 10),
  };
}