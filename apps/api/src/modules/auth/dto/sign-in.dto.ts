import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class SignInDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  /**
   * No minimum length at sign-in: the real check is argon2.verify against the
   * stored hash. The {@link MaxLength} matches SignUpDto and bounds the input
   * to keep argon2's memory-hard hashing from being abused as a DoS vector.
   */
  @IsString()
  @MaxLength(128)
  password!: string;
}