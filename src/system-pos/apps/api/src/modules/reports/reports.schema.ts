import { z } from 'zod';

export const financialReportQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
});

export type FinancialReportQuery = z.infer<typeof financialReportQuerySchema>;

