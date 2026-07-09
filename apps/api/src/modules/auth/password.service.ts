import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

/**
 * Pre-computed hash used as a timing equalizer so that signIn takes the same
 * amount of time whether the email exists or not (prevents user-enumeration
 * timing oracle). The plaintext is irrelevant; we only care that verify
 * performs the same CPU/memory work as a real user lookup.
 */
const DUMMY_HASH_PLAINTEXT =
  'vecta-timing-equalizer-do-not-use-as-credential-9c7a4f';

@Injectable()
export class PasswordService {
  private readonly dummyHashPromise: Promise<string> = argon2.hash(
    DUMMY_HASH_PLAINTEXT,
    ARGON2_OPTIONS,
  );

  hash(plain: string): Promise<string> {
    return argon2.hash(plain, ARGON2_OPTIONS);
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }

  /**
   * Returns a pre-computed argon2 hash that callers should pass to
   * {@link verify} when the real user hash is not available. This keeps
   * signIn latency constant regardless of whether the email exists.
   */
  async getDummyHash(): Promise<string> {
    return this.dummyHashPromise;
  }
}