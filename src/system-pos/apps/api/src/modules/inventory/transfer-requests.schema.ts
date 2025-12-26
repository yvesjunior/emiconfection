import { z } from 'zod';

export const createTransferRequestSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  fromWarehouseId: z.string().uuid('Invalid source warehouse ID'),
  toWarehouseId: z.string().uuid('Invalid destination warehouse ID'),
  notes: z.string().optional(),
  // Explicitly reject quantity if provided - requester cannot specify quantity
}).strict(); // Use strict() to reject any extra fields like quantity

export const approveTransferRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  quantity: z.number().positive('Quantity must be positive').optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // If approved, quantity is required
    if (data.status === 'approved') {
      return data.quantity !== undefined && data.quantity !== null && data.quantity > 0;
    }
    // If rejected, quantity is not needed
    return true;
  },
  {
    message: 'Quantity is required when approving a transfer request',
    path: ['quantity'],
  }
);

export type CreateTransferRequestInput = z.infer<typeof createTransferRequestSchema>;
export type ApproveTransferRequestInput = z.infer<typeof approveTransferRequestSchema>;

