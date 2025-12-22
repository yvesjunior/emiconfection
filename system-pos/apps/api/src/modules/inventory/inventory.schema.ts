import { z } from 'zod';

export const adjustStockSchema = z.object({
  productId: z.string().min(1, 'Invalid product ID'),
  warehouseId: z.string().min(1, 'Invalid warehouse ID'),
  quantity: z.number(), // Can be positive (add) or negative (remove)
  reason: z.string().optional(), // Alias for notes
  notes: z.string().optional(),
});

export const transferStockSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  fromWarehouseId: z.string().uuid('Invalid source warehouse ID'),
  toWarehouseId: z.string().uuid('Invalid destination warehouse ID'),
  quantity: z.number().positive('Quantity must be positive'),
  notes: z.string().optional(),
});

export const setStockLevelsSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  minStockLevel: z.number().min(0).optional(),
  maxStockLevel: z.number().min(0).optional().nullable(),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type TransferStockInput = z.infer<typeof transferStockSchema>;
export type SetStockLevelsInput = z.infer<typeof setStockLevelsSchema>;

