import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { MAX_AGE, MIN_AGE } from './birth-date.validator';
import { SignUpDto } from './sign-up.dto';

const VALID_BASE = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'password1',
  birthDate: '1990-05-01',
};

function buildDto(overrides: Partial<typeof VALID_BASE> = {}): SignUpDto {
  return plainToInstance(SignUpDto, { ...VALID_BASE, ...overrides });
}

describe('SignUpDto', () => {
  it('accepts a fully valid payload', async () => {
    expect(await validate(buildDto())).toHaveLength(0);
  });
});

describe('SignUpDto.firstName', () => {
  it('rejects an empty string', async () => {
    const errors = await validate(buildDto({ firstName: '' }));
    expect(errors.some((e) => e.property === 'firstName')).toBe(true);
  });

  it('rejects whitespace-only after trim', async () => {
    const errors = await validate(buildDto({ firstName: '   ' }));
    expect(errors.some((e) => e.property === 'firstName')).toBe(true);
  });

  it(`rejects names longer than 100 chars`, async () => {
    const errors = await validate(buildDto({ firstName: 'a'.repeat(101) }));
    expect(errors.some((e) => e.property === 'firstName')).toBe(true);
  });

  it('accepts names at the 100-char boundary', async () => {
    const errors = await validate(buildDto({ firstName: 'a'.repeat(100) }));
    expect(errors).toHaveLength(0);
  });

  it('trims surrounding whitespace', async () => {
    const dto = buildDto({ firstName: '  Jane  ' });
    await validate(dto);
    expect(dto.firstName).toBe('Jane');
  });

  it('rejects non-string values', async () => {
    const errors = await validate(buildDto({ firstName: 42 as unknown as string }));
    expect(errors.some((e) => e.property === 'firstName')).toBe(true);
  });
});

describe('SignUpDto.lastName', () => {
  it('rejects an empty string', async () => {
    const errors = await validate(buildDto({ lastName: '' }));
    expect(errors.some((e) => e.property === 'lastName')).toBe(true);
  });

  it('rejects whitespace-only after trim', async () => {
    const errors = await validate(buildDto({ lastName: '   ' }));
    expect(errors.some((e) => e.property === 'lastName')).toBe(true);
  });

  it(`rejects names longer than 100 chars`, async () => {
    const errors = await validate(buildDto({ lastName: 'a'.repeat(101) }));
    expect(errors.some((e) => e.property === 'lastName')).toBe(true);
  });

  it('trims surrounding whitespace', async () => {
    const dto = buildDto({ lastName: '  Doe  ' });
    await validate(dto);
    expect(dto.lastName).toBe('Doe');
  });

  it('rejects non-string values', async () => {
    const errors = await validate(buildDto({ lastName: 42 as unknown as string }));
    expect(errors.some((e) => e.property === 'lastName')).toBe(true);
  });
});

describe('SignUpDto.email', () => {
  it('rejects a non-email string', async () => {
    const errors = await validate(buildDto({ email: 'not-an-email' }));
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('normalizes to lowercase + trimmed before validation', async () => {
    const dto = buildDto({ email: '  JANE@Example.COM  ' });
    await validate(dto);
    expect(dto.email).toBe('jane@example.com');
  });

  it('rejects an empty string', async () => {
    const errors = await validate(buildDto({ email: '' }));
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects non-string values', async () => {
    const errors = await validate(buildDto({ email: 12345 as unknown as string }));
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });
});

describe('SignUpDto.password', () => {
  it('rejects passwords shorter than 8 chars', async () => {
    const errors = await validate(buildDto({ password: 'short1' }));
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('accepts passwords at exactly 8 chars', async () => {
    const errors = await validate(buildDto({ password: 'a'.repeat(8) }));
    expect(errors).toHaveLength(0);
  });

  it('rejects passwords longer than 128 chars', async () => {
    const errors = await validate(buildDto({ password: 'a'.repeat(129) }));
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('accepts passwords at exactly 128 chars', async () => {
    const errors = await validate(buildDto({ password: 'a'.repeat(128) }));
    expect(errors).toHaveLength(0);
  });

  it('rejects non-string values', async () => {
    const errors = await validate(buildDto({ password: 12345 as unknown as string }));
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});

describe('SignUpDto.birthDate', () => {
  it('accepts an ISO date for a 30-year-old user', async () => {
    const thirty = new Date();
    thirty.setFullYear(thirty.getFullYear() - 30);
    const errors = await validate(buildDto({ birthDate: thirty.toISOString().slice(0, 10) }));
    expect(errors).toHaveLength(0);
  });

  it('rejects a non-ISO string', async () => {
    const errors = await validate(buildDto({ birthDate: 'not-a-date' }));
    expect(errors.some((e) => e.property === 'birthDate')).toBe(true);
  });

  it('rejects a future date', async () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const errors = await validate(buildDto({ birthDate: future.toISOString().slice(0, 10) }));
    expect(errors.some((e) => e.property === 'birthDate')).toBe(true);
  });

  it(`rejects users younger than ${MIN_AGE}`, async () => {
    const young = new Date();
    young.setFullYear(young.getFullYear() - (MIN_AGE - 1));
    const errors = await validate(buildDto({ birthDate: young.toISOString().slice(0, 10) }));
    expect(errors.some((e) => e.property === 'birthDate')).toBe(true);
  });

  it(`accepts users exactly ${MIN_AGE} years old`, async () => {
    const exact = new Date();
    exact.setFullYear(exact.getFullYear() - MIN_AGE);
    const errors = await validate(buildDto({ birthDate: exact.toISOString().slice(0, 10) }));
    expect(errors).toHaveLength(0);
  });

  it(`rejects users older than ${MAX_AGE}`, async () => {
    const ancient = new Date();
    ancient.setFullYear(ancient.getFullYear() - (MAX_AGE + 1));
    const errors = await validate(buildDto({ birthDate: ancient.toISOString().slice(0, 10) }));
    expect(errors.some((e) => e.property === 'birthDate')).toBe(true);
  });

  it('rejects non-string values', async () => {
    const errors = await validate(buildDto({ birthDate: 12345 as unknown as string }));
    expect(errors.some((e) => e.property === 'birthDate')).toBe(true);
  });
});