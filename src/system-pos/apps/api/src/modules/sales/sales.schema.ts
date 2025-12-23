import { z } from 'zod';

const saleItemSchema = z.object({
  productId: z.string().min(1, 'Invalid product ID'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  discountAmount: z.number().min(0).optional().default(0),
});

const paymentSchema = z.object({
  method: z.enum(['cash', 'card', 'mobile_money', 'credit']),
  amount: z.number().positive('Amount must be positive'),
  amountReceived: z.number().min(0).optional(), // For cash payments
  reference: z.string().optional(), // For card/mobile payments
});

export const createSaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  warehouseId: z.string().optional(), // Optional - will use employee's warehouse if not provided
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  payments: z.array(paymentSchema).min(1, 'At least one payment is required'),
  discountType: z.enum(['percentage', 'fixed']).optional().nullable(),
  discountValue: z.number().min(0).optional().nullable(),
  taxRate: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const voidSaleSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

export const refundSaleSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
  items: z.array(z.object({
    saleItemId: z.string().uuid(),
    quantity: z.number().positive(),
  })).optional(), // If not provided, full refund
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type VoidSaleInput = z.infer<typeof voidSaleSchema>;
export type RefundSaleInput = z.infer<typeof refundSaleSchema>;

