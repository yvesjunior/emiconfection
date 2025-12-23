import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requirePermission, getWarehouseScope, getWarehouseForCreate } from '../../common/middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import * as inventoryService from './inventory.service.js';
import { adjustStockSchema, transferStockSchema, setStockLevelsSchema } from './inventory.schema.js';

const router = Router();

router.use(authenticate);

// GET /api/inventory - Get inventory levels (scoped by warehouse)
router.get('/', requirePermission(PERMISSIONS.INVENTORY_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const warehouseId = getWarehouseScope(req);
  const query = { ...req.query as any };
  if (warehouseId) {
    query.warehouseId = warehouseId;
  }
  const result = await inventoryService.getInventory(query);
  res.json({ success: true, ...result });
});

// GET /api/inventory/low-stock - Get low stock items (scoped by warehouse)
router.get('/low-stock', requirePermission(PERMISSIONS.INVENTORY_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const warehouseId = getWarehouseScope(req) || req.query.warehouseId as string;
  const result = await inventoryService.getLowStock(warehouseId);
  res.json({ success: true, data: result });
});

// GET /api/inventory/movements - Get stock movements (scoped by warehouse)
router.get('/movements', requirePermission(PERMISSIONS.INVENTORY_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const warehouseId = getWarehouseScope(req);
  const query = { ...req.query as any };
  if (warehouseId) {
    query.warehouseId = warehouseId;
  }
  const result = await inventoryService.getStockMovements(query);
  res.json({ success: true, ...result });
});

// POST /api/inventory/adjust - Adjust stock (uses selected warehouse)
router.post('/adjust', requirePermission(PERMISSIONS.INVENTORY_ADJUST), async (req: AuthenticatedRequest, res: Response) => {
  // Use selected warehouse if warehouseId not specified in body
  if (!req.body.warehouseId) {
    req.body.warehouseId = getWarehouseForCreate(req);
  }
  const input = adjustStockSchema.parse(req.body);
  const result = await inventoryService.adjustStock(input, req.employee!.id);
  res.json({ success: true, data: result });
});

// POST /api/inventory/transfer - Transfer stock between warehouses
router.post('/transfer', requirePermission(PERMISSIONS.INVENTORY_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const input = transferStockSchema.parse(req.body);
  const result = await inventoryService.transferStock(input, req.employee!.id);
  res.json({ success: true, data: result });
});

// PUT /api/inventory/levels - Set min/max stock levels
router.put('/levels', requirePermission(PERMISSIONS.INVENTORY_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const input = setStockLevelsSchema.parse(req.body);
  const result = await inventoryService.setStockLevels(input);
  res.json({ success: true, data: result });
});

export { router as inventoryRouter };

