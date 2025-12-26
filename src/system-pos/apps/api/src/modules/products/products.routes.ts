import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requirePermission, getWarehouseScope, getWarehouseForCreate } from '../../common/middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import * as productsService from './products.service.js';
import { createProductSchema, updateProductSchema } from './products.schema.js';

const router = Router();

router.use(authenticate);

// GET /api/products - List products (scoped by warehouse)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const query = { ...req.query as any };
  
  // CRITICAL: Prioritize query param warehouseId (from frontend) over getWarehouseScope
  // This ensures the frontend can explicitly request products for a specific warehouse
  if (!query.warehouseId) {
    const warehouseId = getWarehouseScope(req);
    if (warehouseId) {
      query.warehouseId = warehouseId;
    }
  }
  
  const result = await productsService.getProducts(query);
  res.json({ success: true, ...result });
});

// GET /api/products/barcode/:barcode - Get product by barcode
// Supports warehouseId query param to filter inventory by warehouse
router.get('/barcode/:barcode', async (req: AuthenticatedRequest, res: Response) => {
  const warehouseId = req.query.warehouseId as string | undefined;
  const result = await productsService.getProductByBarcode(req.params.barcode, warehouseId);
  res.json({ success: true, data: result });
});

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const result = await productsService.getProductById(req.params.id);
  res.json({ success: true, data: result });
});

// POST /api/products - Create product (global, warehouse optional for initial stock)
router.post('/', requirePermission(PERMISSIONS.PRODUCTS_CREATE), async (req: AuthenticatedRequest, res: Response) => {
  // Product creation is global - warehouseId is optional
  // If warehouseId is provided with stock, it will be validated for access
  // If not provided, product is created without initial stock (available globally with 0 stock)
  const input = createProductSchema.parse(req.body);
  const result = await productsService.createProduct(input, req.employee!.id);
  res.status(201).json({ success: true, data: result });
});

// PUT /api/products/:id - Update product
router.put('/:id', requirePermission(PERMISSIONS.PRODUCTS_UPDATE), async (req: AuthenticatedRequest, res: Response) => {
  // Product update is global - warehouseId is optional for stock updates
  // If warehouseId is provided with stock, it will be validated for access
  const input = updateProductSchema.parse(req.body);
  const result = await productsService.updateProduct(req.params.id, input, req.employee!.id);
  res.json({ success: true, data: result });
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', requirePermission(PERMISSIONS.PRODUCTS_DELETE), async (req: AuthenticatedRequest, res: Response) => {
  const result = await productsService.deleteProduct(req.params.id, req.employee!.roleName, req.employee!.id);
  res.json({ success: true, ...result });
});

export { router as productsRouter };

