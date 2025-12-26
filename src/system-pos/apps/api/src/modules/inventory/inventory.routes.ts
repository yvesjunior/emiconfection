import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requirePermission, getWarehouseScope, getWarehouseForCreate, requireWarehouseAccess } from '../../common/middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import * as inventoryService from './inventory.service.js';
import * as transferRequestsService from './transfer-requests.service.js';
import { adjustStockSchema, transferStockSchema, setStockLevelsSchema } from './inventory.schema.js';
import { createTransferRequestSchema, approveTransferRequestSchema } from './transfer-requests.schema.js';

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

// POST /api/inventory/transfer - Create a transfer request (all transfers require approval)
// This endpoint now always creates a transfer request - no automatic transfers
// Quantity is NOT specified during creation - it will be set during approval
router.post('/transfer', requirePermission(PERMISSIONS.INVENTORY_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const input = createTransferRequestSchema.parse(req.body);
  
  // Validate warehouse access - employee must have access to source warehouse
  // Check if employee has access to the source warehouse
  const employee = await prisma.employee.findUnique({
    where: { id: req.employee!.id },
    include: {
      warehouses: {
        select: { warehouseId: true },
      },
    },
  });

  if (!employee) {
    return res.status(403).json({ success: false, message: 'Employee not found' });
  }

  const assignedWarehouseIds = employee.warehouses.map((ew) => ew.warehouseId);
  if (employee.warehouseId) {
    assignedWarehouseIds.push(employee.warehouseId);
  }
  const hasAccess = assignedWarehouseIds.includes(input.fromWarehouseId);
  const isAdmin = req.employee!.roleName === 'admin';

  // Admins have access to all warehouses, others need explicit access
  if (!hasAccess && !isAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: 'You do not have access to the source warehouse' 
    });
  }
  
  // Create transfer request without quantity (quantity will be set during approval)
  const transferRequest = await transferRequestsService.createTransferRequest(input, req.employee!.id);
  
  res.status(201).json({ 
    success: true, 
    data: transferRequest,
    message: 'Transfer request created - awaiting approval',
    isTransferRequest: true
  });
});

// PUT /api/inventory/levels - Set min/max stock levels
router.put('/levels', requirePermission(PERMISSIONS.INVENTORY_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const input = setStockLevelsSchema.parse(req.body);
  const result = await inventoryService.setStockLevels(input);
  res.json({ success: true, data: result });
});

// GET /api/inventory/transfer-requests - List transfer requests
router.get('/transfer-requests', requirePermission(PERMISSIONS.INVENTORY_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const result = await transferRequestsService.getTransferRequests(
    req.query as any,
    req.employee!.id,
    req.employee!.roleName
  );
  res.json({ success: true, ...result });
});

// GET /api/inventory/transfer-requests/:id - Get transfer request by ID
router.get('/transfer-requests/:id', requirePermission(PERMISSIONS.INVENTORY_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const result = await transferRequestsService.getTransferRequestById(req.params.id);
  res.json({ success: true, data: result });
});

// POST /api/inventory/transfer-requests - Create transfer request
router.post('/transfer-requests', requirePermission(PERMISSIONS.INVENTORY_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const input = createTransferRequestSchema.parse(req.body);
  const result = await transferRequestsService.createTransferRequest(input, req.employee!.id);
  res.status(201).json({ success: true, data: result });
});

// PUT /api/inventory/transfer-requests/:id/approve - Approve/reject transfer request
router.put('/transfer-requests/:id/approve', requirePermission(PERMISSIONS.INVENTORY_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const input = approveTransferRequestSchema.parse(req.body);
  const result = await transferRequestsService.approveTransferRequest(
    req.params.id,
    input,
    req.employee!.id,
    req.employee!.roleName
  );
  res.json({ success: true, data: result });
});

// PUT /api/inventory/transfer-requests/:id/receive - Mark transfer request as received and transfer stock
router.put('/transfer-requests/:id/receive', requirePermission(PERMISSIONS.INVENTORY_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const result = await transferRequestsService.markTransferRequestAsReceived(
    req.params.id,
    req.employee!.id,
    req.employee!.roleName
  );
  res.json({ success: true, data: result });
});

export { router as inventoryRouter };

