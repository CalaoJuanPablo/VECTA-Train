import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { signInSchema, signUpSchema } from './schemas';

describe('signInSchema', () => {
  it('accepts a valid email and password', () => {
    expect(signInSchema.safeParse({ email: 'jane@example.com', password: 'password1' }).success).toBe(
      true,
    );
  });

  it('rejects an invalid email and a short password', () => {
    const result = signInSchema.safeParse({ email: 'nope', password: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = z.flattenError(result.error).fieldErrors;
      expect(fields.email).toBeTruthy();
      expect(fields.password).toBeTruthy();
    }
  });
});

describe('signUpSchema', () => {
  const valid = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    password: 'password1',
    birthDate: '1990-05-01',
  };

  it('accepts a complete, valid sign-up', () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it('requires first and last name', () => {
    const result = signUpSchema.safeParse({ ...valid, firstName: '', lastName: '' });
    expect(result.success).toBe(false);
  });

  it('requires a number in the password', () => {
    const result = signUpSchema.safeParse({ ...valid, password: 'passwordonly' });
    expect(result.success).toBe(false);
  });

  it('rejects a future birth date', () => {
    const result = signUpSchema.safeParse({ ...valid, birthDate: '3000-01-01' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.flattenError(result.error).fieldErrors.birthDate).toBeTruthy();
    }
  });

  it('rejects an implausibly young age', () => {
    const thisYear = new Date().getFullYear();
    const result = signUpSchema.safeParse({ ...valid, birthDate: `${thisYear - 5}-01-01` });
    expect(result.success).toBe(false);
  });
});
