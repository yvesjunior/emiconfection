import { z } from 'zod';

export const createEmployeeSchema = z.object({
  phone: z.string().min(1, 'Phone is required'),
  pinCode: z.string().min(4).max(6).optional().nullable(), // PIN for mobile POS login
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  roleId: z.string().min(1, 'Role is required'),
  warehouseId: z.string().min(1, 'Warehouse is required').optional().nullable(), // Primary warehouse (for backward compatibility)
  warehouseIds: z.array(z.string().uuid()).optional().default([]), // Multiple warehouse assignments
  isActive: z.boolean().optional().default(true),
}).refine((data) => {
  // Admin role doesn't require warehouse, but other roles do
  // We'll check this in the service layer since we need to fetch the role
  return true;
}, {
  message: 'Warehouse is required for non-admin roles',
});

export const updateEmployeeSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  pinCode: z.string().min(4).max(6).nullable().optional(), // PIN for mobile POS login
  roleId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().nullable().optional(), // Primary warehouse (for backward compatibility)
  warehouseIds: z.array(z.string().uuid()).optional(), // Multiple warehouse assignments
  isActive: z.boolean().optional(),
}).refine((data) => {
  // If roleId is provided, check warehouse requirement
  if (data.roleId) {
    // This will be checked in the service layer based on role name
    return true;
  }
  return true;
});

export const resetPinSchema = z.object({
  newPin: z.string().min(4).max(6),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ResetPinInput = z.infer<typeof resetPinSchema>;

