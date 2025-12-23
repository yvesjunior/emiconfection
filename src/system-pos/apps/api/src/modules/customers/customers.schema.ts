import { z } from 'zod';

const customerBaseSchema = z.object({
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createCustomerSchema = customerBaseSchema.refine(
  data => data.name || data.phone,
  { message: 'At least name or phone is required' }
);

export const updateCustomerSchema = customerBaseSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
