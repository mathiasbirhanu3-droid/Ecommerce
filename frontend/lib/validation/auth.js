import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Za-z]/, 'Must contain a letter')
  .regex(/\d/, 'Must contain a number');

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({ password: passwordSchema, confirm: z.string().min(1, 'Confirm your password') })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });

/** Zod error → { fieldName: message } for our TextField error props. */
export function zodToFieldErrors(zodError) {
  const out = {};
  for (const issue of zodError.issues) out[issue.path[0]] = issue.message;
  return out;
}

/** Server error envelope errors[] → { fieldName: message }. */
export function apiFieldErrorsToMap(fieldErrors = []) {
  const out = {};
  for (const e of fieldErrors) {
    const field = String(e.field || '').replace('body.', '');
    if (field && field !== '_form') out[field] = out[field] || e.message;
  }
  return out;
}