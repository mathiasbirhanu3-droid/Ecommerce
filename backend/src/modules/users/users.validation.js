const { z } = require('zod');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

const updateProfileSchema = z.object({
  body: z.object({ name: z.string().trim().min(2).max(80) }),
});

const changePasswordSchema = z.object({
  body: z.object({ currentPassword: z.string().min(1, 'Current password is required'), newPassword: passwordSchema }),
});

const addressSchema = z.object({
  fullName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(6).max(20),
  street: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(60),
  state: z.string().trim().max(60).optional().default(''),
  country: z.string().trim().max(60).optional().default(''),
  postalCode: z.string().trim().max(20).optional().default(''),
});

const updateAddressSchema = z.object({ body: addressSchema });

module.exports = { updateProfileSchema, changePasswordSchema, updateAddressSchema };