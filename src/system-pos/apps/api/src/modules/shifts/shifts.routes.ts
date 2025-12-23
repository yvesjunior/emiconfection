import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requirePermission, getWarehouseScope, getWarehouseForCreate } from '../../common/middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import * as shiftsService from './shifts.service.js';
import { startShiftSchema, endShiftSchema } from './shifts.schema.js';

const router = Router();

router.use(authenticate);

// GET /api/shifts - List shifts (scoped by warehouse)
router.get('/', requirePermission(PERMISSIONS.SHIFTS_VIEW_ALL), async (req: AuthenticatedRequest, res: Response) => {
  const warehouseId = getWarehouseScope(req);
  const query = { ...req.query as any };
  if (warehouseId) {
    query.warehouseId = warehouseId;
  }
  const result = await shiftsService.getShifts(query);
  res.json({ success: true, ...result });
});

// GET /api/shifts/current - Get current employee's open shift
router.get('/current', async (req: AuthenticatedRequest, res: Response) => {
  const result = await shiftsService.getCurrentShift(req.employee!.id);
  res.json({ success: true, data: result });
});

// GET /api/shifts/:id - Get shift by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const result = await shiftsService.getShiftById(req.params.id);
  
  // Only allow viewing own shift or if has permission
  if (result.employeeId !== req.employee!.id && 
      !req.employee!.permissions.includes(PERMISSIONS.SHIFTS_VIEW_ALL) &&
      req.employee!.roleName !== 'admin') {
    res.status(403).json({ success: false, message: 'Access denied' });
    return;
  }
  
  res.json({ success: true, data: result });
});

// GET /api/shifts/:id/sales - Get sales in a shift
router.get('/:id/sales', async (req: AuthenticatedRequest, res: Response) => {
  const result = await shiftsService.getShiftSales(req.params.id, req.query as any);
  res.json({ success: true, ...result });
});

// POST /api/shifts/start - Start a new shift (uses selected warehouse)
router.post('/start', async (req: AuthenticatedRequest, res: Response) => {
  // Use selected warehouse for the shift
  if (!req.body.warehouseId) {
    req.body.warehouseId = getWarehouseForCreate(req);
  }
  const input = startShiftSchema.parse(req.body);
  const result = await shiftsService.startShift(input, req.employee!.id);
  res.status(201).json({ success: true, data: result });
});

// POST /api/shifts/end - End current shift
router.post('/end', async (req: AuthenticatedRequest, res: Response) => {
  const input = endShiftSchema.parse(req.body);
  const result = await shiftsService.endShift(req.employee!.id, input);
  res.json({ success: true, data: result });
});

export { router as shiftsRouter };

