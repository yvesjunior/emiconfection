import { z } from 'zod';

export const createTransferRequestSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  fromWarehouseId: z.string().uuid('Invalid source warehouse ID'),
  toWarehouseId: z.string().uuid('Invalid destination warehouse ID'),
  quantity: z.number().positive('Quantity must be positive'),
  notes: z.string().optional(),
});

export const approveTransferRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
});

export type CreateTransferRequestInput = z.infer<typeof createTransferRequestSchema>;
export type ApproveTransferRequestInput = z.infer<typeof approveTransferRequestSchema>;

