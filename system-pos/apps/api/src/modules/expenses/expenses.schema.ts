import { z } from 'zod';

export const createExpenseCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateExpenseCategorySchema = createExpenseCategorySchema.partial();

export const createExpenseSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  warehouseId: z.string().optional(), // Optional, will use employee's warehouse if not provided
  amount: z.number().positive('Amount must be positive'),
  description: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  date: z.string().datetime().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const getExpensesQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  categoryId: z.string().optional(),
  warehouseId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});

export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategoryInput = z.infer<typeof updateExpenseCategorySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type GetExpensesQuery = z.infer<typeof getExpensesQuerySchema>;

