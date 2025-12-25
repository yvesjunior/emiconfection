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
  const warehouseId = getWarehouseScope(req);
  const query = { ...req.query as any };
  if (warehouseId) {
    query.warehouseId = warehouseId;
  }
  const result = await productsService.getProducts(query);
  res.json({ success: true, ...result });
});

// GET /api/products/barcode/:barcode - Get product by barcode
router.get('/barcode/:barcode', async (req: AuthenticatedRequest, res: Response) => {
  const result = await productsService.getProductByBarcode(req.params.barcode);
  res.json({ success: true, data: result });
});

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const result = await productsService.getProductById(req.params.id);
  res.json({ success: true, data: result });
});

// POST /api/products - Create product (uses selected warehouse)
router.post('/', requirePermission(PERMISSIONS.PRODUCTS_CREATE), async (req: AuthenticatedRequest, res: Response) => {
  // Use selected warehouse or employee's assigned warehouse
  req.body.warehouseId = getWarehouseForCreate(req);
  const input = createProductSchema.parse(req.body);
  const result = await productsService.createProduct(input);
  res.status(201).json({ success: true, data: result });
});

// PUT /api/products/:id - Update product
router.put('/:id', requirePermission(PERMISSIONS.PRODUCTS_UPDATE), async (req: AuthenticatedRequest, res: Response) => {
  // Use selected warehouse or employee's assigned warehouse if not specified
  if (!req.body.warehouseId) {
    req.body.warehouseId = getWarehouseForCreate(req);
  }
  const input = updateProductSchema.parse(req.body);
  const result = await productsService.updateProduct(req.params.id, input);
  res.json({ success: true, data: result });
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', requirePermission(PERMISSIONS.PRODUCTS_DELETE), async (req: AuthenticatedRequest, res: Response) => {
  const result = await productsService.deleteProduct(req.params.id, req.employee!.roleName);
  res.json({ success: true, ...result });
});

export { router as productsRouter };

