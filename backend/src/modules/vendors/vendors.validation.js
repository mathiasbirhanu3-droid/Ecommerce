const { z } = require('zod');

const cloudinaryUrl = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .refine((v) => v.startsWith('https://res.cloudinary.com/'), 'Image must be hosted on Cloudinary')
  .optional()
  .or(z.literal(''));

const cents = (label) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number` })
    .int(`${label} is invalid`)
    .min(0, `${label} cannot be negative`)
    .max(10_000_000, `${label} is too large`);

const applySchema = z.object({
  body: z.object({
    storeName: z.string().trim().min(3, 'Store name is too short').max(60),
    description: z.string().trim().max(2000).optional().default(''),
    logo: cloudinaryUrl.default(''),
    banner: cloudinaryUrl.default(''),
  }),
});

const updateVendorSchema = z.object({
  body: z
    .object({
      storeName: z.string().trim().min(3).max(60).optional(),
      description: z.string().trim().max(2000).optional(),
      logo: cloudinaryUrl,
      banner: cloudinaryUrl,
      shippingFee: cents('Shipping fee').optional(),
      freeShippingOver: cents('Free-shipping threshold').nullable().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: 'Nothing to update' }),
});

const setStatusSchema = z.object({
  body: z.object({ status: z.enum(['approved', 'suspended']) }), // pending only via apply; no un-approve path in MVP
});

const listQuerySchema = z.object({
  query: z
    .object({
      status: z.enum(['pending', 'approved', 'suspended']).optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(48).optional(),
    })
    .optional(),
});
const publicSlugSchema = z.object({ params: z.object({ slug: z.string().trim().min(1).max(80) }) });
module.exports = { applySchema, updateVendorSchema, setStatusSchema, listQuerySchema, publicSlugSchema };

const setStatusWithIdSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') }),
  body: z.object({ status: z.enum(['approved', 'suspended']) }),
});
// route: router.patch('/vendors/:id/status', validate(setStatusWithIdSchema), controller.setVendorStatus);