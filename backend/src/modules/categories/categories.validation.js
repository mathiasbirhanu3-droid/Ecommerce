const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const createSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60),
    image: z.string().trim().url().optional().default(''),
    parent: objectId.nullable().optional().default(null),
  }),
});

const updateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().trim().min(2).max(60).optional(),
      image: z.string().trim().url().optional(),
      parent: objectId.nullable().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: 'Nothing to update' }),
});

const idParamSchema = z.object({ params: z.object({ id: objectId }) });

module.exports = { createSchema, updateSchema, idParamSchema };