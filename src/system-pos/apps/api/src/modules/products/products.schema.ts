import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional().nullable(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().nullable(),
  // Support both single categoryId (backward compat) and multiple categoryIds
  categoryId: z.string().min(1, 'Invalid category ID').optional(),
  categoryIds: z.array(z.string().min(1, 'Invalid category ID')).optional(),
  costPrice: z.number().min(0, 'Cost price must be 0 or positive'),
  transportFee: z.number().min(0, 'Transport fee must be 0 or positive').optional().default(0),
  sellingPrice: z.number().positive('Selling price must be positive'),
  unit: z.string().optional().default('piece'),
  imageUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  // Stock management
  stock: z.number().int().min(0, 'Stock must be 0 or positive').optional().default(0),
  minStockLevel: z.number().int().min(0).optional().default(1),
  warehouseId: z.string().optional(), // If not provided, use default warehouse
}).refine(data => data.categoryId || (data.categoryIds && data.categoryIds.length > 0), {
  message: 'At least one category is required (categoryId or categoryIds)',
});

export const updateProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required').optional(),
  barcode: z.string().optional().nullable(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'Invalid category ID').optional(),
  categoryIds: z.array(z.string().min(1, 'Invalid category ID')).optional(),
  costPrice: z.number().min(0, 'Cost price must be 0 or positive').optional(),
  transportFee: z.number().min(0, 'Transport fee must be 0 or positive').optional(),
  sellingPrice: z.number().positive('Selling price must be positive').optional(),
  unit: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
  // Stock management
  stock: z.number().int().min(0, 'Stock must be 0 or positive').optional(),
  minStockLevel: z.number().int().min(0).optional(),
  warehouseId: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

