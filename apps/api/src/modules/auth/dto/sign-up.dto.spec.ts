import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { MAX_AGE, MIN_AGE } from './birth-date.validator';
import { SignUpDto } from './sign-up.dto';

const VALID_BASE = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'password1',
};

function buildDto(birthDate: string): SignUpDto {
  const dto = Object.assign(new SignUpDto(), VALID_BASE, { birthDate });
  return dto;
}

describe('SignUpDto.birthDate', () => {
  it('accepts an ISO date for a 30-year-old user', async () => {
    const thirty = new Date();
    thirty.setFullYear(thirty.getFullYear() - 30);
    const errors = await validate(buildDto(thirty.toISOString().slice(0, 10)));
    expect(errors).toHaveLength(0);
  });

  it('rejects a non-ISO string', async () => {
    const errors = await validate(buildDto('not-a-date'));
    expect(errors.some((e) => e.property === 'birthDate')).toBe(true);
  });

  it('rejects a future date', async () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const errors = await validate(buildDto(future.toISOString().slice(0, 10)));
    expect(errors.some((e) => e.property === 'birthDate')).toBe(true);
  });

  it(`rejects users younger than ${MIN_AGE}`, async () => {
    const young = new Date();
    young.setFullYear(young.getFullYear() - (MIN_AGE - 1));
    const errors = await validate(buildDto(young.toISOString().slice(0, 10)));
    expect(errors.some((e) => e.property === 'birthDate')).toBe(true);
  });

  it(`accepts users exactly ${MIN_AGE} years old`, async () => {
    const exact = new Date();
    exact.setFullYear(exact.getFullYear() - MIN_AGE);
    const errors = await validate(buildDto(exact.toISOString().slice(0, 10)));
    expect(errors).toHaveLength(0);
  });

  it(`rejects users older than ${MAX_AGE}`, async () => {
    const ancient = new Date();
    ancient.setFullYear(ancient.getFullYear() - (MAX_AGE + 1));
    const errors = await validate(buildDto(ancient.toISOString().slice(0, 10)));
    expect(errors.some((e) => e.property === 'birthDate')).toBe(true);
  });

  it('rejects non-string values', async () => {
    const dto = Object.assign(new SignUpDto(), VALID_BASE, { birthDate: 12345 as unknown as string });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'birthDate')).toBe(true);
  });
});