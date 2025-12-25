import { z } from 'zod';

export const createWarehouseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  type: z.enum(['BOUTIQUE', 'STOCKAGE']).optional().default('BOUTIQUE'),
  address: z.string().nullish(),
  phone: z.string().nullish(),
  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  code: z.string().min(2, 'Code must be at least 2 characters').optional(),
  type: z.enum(['BOUTIQUE', 'STOCKAGE']).optional(),
  address: z.string().nullish(),
  phone: z.string().nullish(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;

