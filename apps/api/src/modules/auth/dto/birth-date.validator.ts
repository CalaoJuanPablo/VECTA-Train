import { registerDecorator, ValidationOptions } from 'class-validator';

/** Minimum and maximum age allowed for sign-up. Matches the web zod schema. */
export const MIN_AGE = 13;
export const MAX_AGE = 120;

function yearsSince(date: Date, now: Date): number {
  let age = now.getFullYear() - date.getFullYear();
  const monthDelta = now.getMonth() - date.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Validator that ensures `value` is an ISO-8601 date string for a real,
 * past date and that the implied age is within {@link MIN_AGE}..{@link MAX_AGE}.
 * Mirrors the client-side zod schema in `apps/web/src/app/login/schemas.ts`.
 */
export function IsValidBirthDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidBirthDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return false;
          if (date.getTime() > Date.now()) return false;
          const age = yearsSince(date, new Date());
          return age >= MIN_AGE && age <= MAX_AGE;
        },
        defaultMessage() {
          return `birthDate must be a valid past date and the user must be between ${MIN_AGE} and ${MAX_AGE} years old`;
        },
      },
    });
  };
}