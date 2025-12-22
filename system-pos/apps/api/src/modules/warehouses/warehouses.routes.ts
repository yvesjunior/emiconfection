import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requirePermission } from '../../common/middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import * as warehousesService from './warehouses.service.js';
import { createWarehouseSchema, updateWarehouseSchema } from './warehouses.schema.js';

const router = Router();

router.use(authenticate);

// GET /api/warehouses - List warehouses
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true';
  const result = await warehousesService.getWarehouses(includeInactive);
  res.json({ success: true, data: result });
});

// GET /api/warehouses/:id - Get warehouse by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const result = await warehousesService.getWarehouseById(req.params.id);
  res.json({ success: true, data: result });
});

// POST /api/warehouses - Create warehouse
router.post('/', requirePermission(PERMISSIONS.WAREHOUSES_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const input = createWarehouseSchema.parse(req.body);
  const result = await warehousesService.createWarehouse(input);
  res.status(201).json({ success: true, data: result });
});

// PUT /api/warehouses/:id - Update warehouse
router.put('/:id', requirePermission(PERMISSIONS.WAREHOUSES_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const input = updateWarehouseSchema.parse(req.body);
  const result = await warehousesService.updateWarehouse(req.params.id, input);
  res.json({ success: true, data: result });
});

// DELETE /api/warehouses/:id - Delete warehouse
router.delete('/:id', requirePermission(PERMISSIONS.WAREHOUSES_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const result = await warehousesService.deleteWarehouse(req.params.id);
  res.json({ success: true, ...result });
});

export { router as warehousesRouter };

