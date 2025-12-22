import { z } from 'zod';

export const createEmployeeSchema = z.object({
  phone: z.string().min(1, 'Phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  pinCode: z.string().min(4).max(6).optional().nullable(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().nullable(),
  roleId: z.string().min(1, 'Role is required'),
  warehouseId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ password: true });

export const resetPinSchema = z.object({
  newPin: z.string().min(4).max(6),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ResetPinInput = z.infer<typeof resetPinSchema>;

