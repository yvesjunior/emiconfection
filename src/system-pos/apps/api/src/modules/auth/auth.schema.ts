import { z } from 'zod';

export const loginSchema = z.object({
  phone: z.string({
    required_error: 'Phone number is required',
    invalid_type_error: 'Phone must be a string'
  }).min(4, 'Phone number must be at least 4 characters'),
  password: z.string({
    required_error: 'Password (PIN) is required',
    invalid_type_error: 'Password must be a string'
  }).min(4, 'Password (PIN) must be at least 4 characters'),
});

export const pinLoginSchema = z.object({
  phone: z.string().min(4, 'Phone number is required'),
  pin: z.string().min(4, 'PIN must be at least 4 digits').max(6, 'PIN must be at most 6 digits'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePinSchema = z.object({
  currentPin: z.string().min(4).max(6).optional(),
  newPin: z.string().min(4, 'PIN must be at least 4 digits').max(6, 'PIN must be at most 6 digits'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type PinLoginInput = z.infer<typeof pinLoginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePinInput = z.infer<typeof changePinSchema>;

