import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { SignInDto } from './sign-in.dto';

const VALID = { email: 'jane@example.com', password: 'password1' };

function build(overrides: Partial<typeof VALID> = {}): SignInDto {
  return plainToInstance(SignInDto, { ...VALID, ...overrides });
}

describe('SignInDto.password', () => {
  it('accepts a valid email + password', async () => {
    expect(await validate(build())).toHaveLength(0);
  });

  it('accepts an empty password (real check is argon2.verify)', async () => {
    const errors = await validate(build({ password: '' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects a password longer than 128 chars (DoS bound)', async () => {
    const errors = await validate(build({ password: 'a'.repeat(129) }));
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('accepts a password at exactly the 128-char boundary', async () => {
    const errors = await validate(build({ password: 'a'.repeat(128) }));
    expect(errors).toHaveLength(0);
  });

  it('rejects a non-string password', async () => {
    const errors = await validate(build({ password: 12345 as unknown as string }));
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});

describe('SignInDto.email', () => {
  it('normalizes email to lowercase + trimmed before validation', async () => {
    const dto = build({ email: '  JANE@Example.COM  ' });
    await validate(dto);
    expect(dto.email).toBe('jane@example.com');
  });

  it('rejects a non-email string', async () => {
    const errors = await validate(build({ email: 'not-an-email' }));
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });
});