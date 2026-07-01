import { z } from 'zod';

const email = z.email('Enter a valid email address');
const password = z.string().min(8, 'Password must be at least 8 characters');

function yearsSince(date: Date): number {
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDelta = now.getMonth() - date.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

const birthDate = z
  .string()
  .min(1, 'Birth date is required')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date')
  .refine((value) => new Date(value) <= new Date(), 'Birth date cannot be in the future')
  .refine((value) => {
    const age = yearsSince(new Date(value));
    return age >= 13 && age <= 120;
  }, 'You must be at least 13 years old');

export const signInSchema = z.object({
  email,
  password,
});

export const signUpSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email,
  password: password.regex(/[0-9]/, 'Include at least one number'),
  birthDate,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
