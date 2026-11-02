const { z } = require('zod');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');

const nameSchema = z.string().trim().min(2, 'Name is too short').max(80);

// The validate() middleware parses { body, params, query } — schemas define the full envelope.
const registerSchema = z.object({
  body: z.object({ name: nameSchema, email: emailSchema, password: passwordSchema }),
});

const loginSchema = z.object({
  body: z.object({ email: emailSchema, password: z.string().min(1, 'Password is required') }),
});

const forgotPasswordSchema = z.object({ body: z.object({ email: emailSchema }) });

const resetPasswordSchema = z.object({
  params: z.object({ token: z.string().min(32, 'Invalid reset token') }),
  body: z.object({ password: passwordSchema }),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };