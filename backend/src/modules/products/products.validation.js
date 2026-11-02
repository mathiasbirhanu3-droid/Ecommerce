const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const cents = (label) =>
  z.coerce.number({ invalid_type_error: `${label} must be a number` })
    .int(`${label} must be whole cents`).min(0, `${label} cannot be negative`).max(10_000_000, `${label} is too large`);

const imageSchema = z.object({
  url: z.string().trim().url('Image URL is invalid')
    .refine((v) => v.startsWith('https://res.cloudinary.com/'), 'Images must be hosted on Cloudinary'),
  alt: z.string().trim().min(3, 'Alt text is required (accessibility + SEO)').max(120),
});

const bodySchema = z.object({
  name: z.string().trim().min(3, 'Name is too short').max(120),
  description: z.string().trim().min(10, 'Description is too short').max(5000),
  categoryId: objectId,
  price: cents('Price'),
  comparePrice: cents('Compare price').nullable().optional(),
  stock: z.coerce.number().int('Stock must be a whole number').min(0).max(100_000),
  images: z.array(imageSchema).min(1, 'At least one image is required').max(5, 'Max 5 images'),
  options: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(30),
        values: z.array(z.string().trim().min(1).max(30)).min(1).max(20),
      })
    )
    .max(3, 'Max 3 option groups')
    .optional()
    .default([]),
})
.refine((b) => b.comparePrice == null || b.comparePrice > b.price, {
  message: 'Compare price must be higher than price', path: ['comparePrice'],
});

const createSchema = z.object({ body: bodySchema });

const updateSchema = z.object({
  params: z.object({ id: objectId }),
  body: bodySchema.partial().refine(
    (b) => b.comparePrice == null || b.price == null || b.comparePrice > b.price,
    { message: 'Compare price must be higher than price', path: ['comparePrice'] }
  ),
});

const moderateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ isActive: z.boolean() }),
});

// §8.1 conventions — bracket params arrive nested via express 'extended' query parsing.
const listQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(48).optional(),
      sort: z.enum(['newest', 'price', '-price']).optional(), // FR-SRH-02 whitelist
      search: z.string().trim().min(2, 'Search needs at least 2 characters').max(60).optional(),
      category: z.string().trim().min(1).max(80).optional(),  // slug
      vendor: z.string().trim().min(1).max(80).optional(),    // slug
      price: z
        .object({
          gte: z.coerce.number().int().min(0).optional(),
          lte: z.coerce.number().int().min(0).optional(),
        })
        .optional(),
    })
    .optional(),
});
const slugParamSchema = z.object({ params: z.object({ slug: z.string().trim().min(1).max(160) }) });
const idParamSchema = z.object({ params: z.object({ id: objectId }) });
module.exports = { createSchema, updateSchema, moderateSchema, listQuerySchema, objectId, slugParamSchema, idParamSchema };