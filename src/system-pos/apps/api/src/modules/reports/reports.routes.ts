import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requirePermission } from '../../common/middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import * as reportsService from './reports.service.js';
import { financialReportQuerySchema } from './reports.schema.js';

const router = Router();

router.use(authenticate);

// GET /api/reports/financial - Get financial report
router.get('/financial', requirePermission(PERMISSIONS.EXPENSES_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const query = financialReportQuerySchema.parse(req.query);
  const result = await reportsService.getFinancialReport(
    query,
    req.employee!.roleName,
    req.employee!.id
  );
  res.json({ success: true, data: result });
});

export { router as reportsRouter };

