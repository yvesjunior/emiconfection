import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requirePermission, getWarehouseScope, getWarehouseForCreate } from '../../common/middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import * as salesService from './sales.service.js';
import { createSaleSchema, voidSaleSchema, refundSaleSchema } from './sales.schema.js';

const router = Router();

router.use(authenticate);

// GET /api/sales - List sales (scoped by warehouse)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const query = { ...req.query } as any;
  
  // Scope by warehouse
  const warehouseId = getWarehouseScope(req);
  if (warehouseId) {
    query.warehouseId = warehouseId;
  }
  
  // Cashiers can only see their own sales
  if (!req.employee!.permissions.includes(PERMISSIONS.SALES_VIEW_ALL) && 
      req.employee!.roleName !== 'Admin') {
    query.employeeId = req.employee!.id;
  }
  
  const result = await salesService.getSales(query);
  res.json({ success: true, ...result });
});

// GET /api/sales/invoice/:invoiceNumber - Get sale by invoice number
router.get('/invoice/:invoiceNumber', async (req: AuthenticatedRequest, res: Response) => {
  const result = await salesService.getSaleByInvoice(req.params.invoiceNumber);
  res.json({ success: true, data: result });
});

// GET /api/sales/:id - Get sale by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const result = await salesService.getSaleById(req.params.id);
  res.json({ success: true, data: result });
});

// POST /api/sales - Create a new sale (checkout, uses selected warehouse)
router.post('/', requirePermission(PERMISSIONS.SALES_CREATE), async (req: AuthenticatedRequest, res: Response) => {
  // Use selected warehouse or employee's assigned warehouse
  req.body.warehouseId = getWarehouseForCreate(req);
  const input = createSaleSchema.parse(req.body);
  const result = await salesService.createSale(input, req.employee!.id);
  res.status(201).json({ success: true, data: result });
});

// POST /api/sales/:id/void - Void a sale
router.post('/:id/void', requirePermission(PERMISSIONS.SALES_VOID), async (req: AuthenticatedRequest, res: Response) => {
  const input = voidSaleSchema.parse(req.body);
  const result = await salesService.voidSale(req.params.id, input, req.employee!.id);
  res.json({ success: true, data: result });
});

// POST /api/sales/:id/refund - Refund a sale
router.post('/:id/refund', requirePermission(PERMISSIONS.SALES_REFUND), async (req: AuthenticatedRequest, res: Response) => {
  const input = refundSaleSchema.parse(req.body);
  const result = await salesService.refundSale(req.params.id, input, req.employee!.id);
  res.json({ success: true, data: result });
});

export { router as salesRouter };

