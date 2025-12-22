import { z } from 'zod';

export const startShiftSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  openingCash: z.number().min(0, 'Opening cash must be non-negative'),
});

export const endShiftSchema = z.object({
  closingCash: z.number().min(0, 'Closing cash must be non-negative'),
  notes: z.string().optional(),
});

export type StartShiftInput = z.infer<typeof startShiftSchema>;
export type EndShiftInput = z.infer<typeof endShiftSchema>;

