import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requirePermission } from '../../common/middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import * as alertsService from './alerts.service.js';

const router = Router();

router.use(authenticate);

// GET /api/alerts - Get alerts for managers/admins
router.get('/', requirePermission(PERMISSIONS.INVENTORY_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const result = await alertsService.getAlerts(
    req.query as any,
    req.employee!.id,
    req.employee!.roleName
  );
  res.json({ success: true, ...result });
});

// GET /api/alerts/count - Get unread alerts count
router.get('/count', requirePermission(PERMISSIONS.INVENTORY_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const count = await alertsService.getUnreadAlertsCount(
    req.employee!.id,
    req.employee!.roleName
  );
  res.json({ success: true, count });
});

// PUT /api/alerts/:id/read - Mark alert as read
router.put('/:id/read', requirePermission(PERMISSIONS.INVENTORY_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const result = await alertsService.markAlertAsRead(req.params.id, req.employee!.id);
  res.json({ success: true, data: result });
});

// PUT /api/alerts/read-all - Mark all alerts as read
router.put('/read-all', requirePermission(PERMISSIONS.INVENTORY_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const result = await alertsService.markAllAlertsAsRead(
    req.employee!.id,
    req.employee!.roleName
  );
  res.json({ success: true, data: result });
});

export { router as alertsRouter };

