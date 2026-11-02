import { z } from 'zod';

export const applySchema = z.object({
  storeName: z.string().trim().min(3, 'Store name is too short').max(60),
  description: z.string().trim().max(2000, 'Description is too long').optional().or(z.literal('')),
});

export const settingsSchema = z.object({
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  shippingFee: z.string().trim(),          // dollar string → converted to cents on submit
  freeShippingOver: z.string().trim(),     // empty string = no free shipping (null)
});

export function zodToFieldErrors(zodError) {
  const out = {};
  for (const issue of zodError.issues) out[issue.path[0]] = issue.message;
  return out;
}