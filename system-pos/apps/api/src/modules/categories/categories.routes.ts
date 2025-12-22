import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requirePermission } from '../../common/middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import * as categoriesService from './categories.service.js';
import { createCategorySchema, updateCategorySchema } from './categories.schema.js';

const router = Router();

router.use(authenticate);

// GET /api/categories - List all categories
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true';
  const result = await categoriesService.getCategories(includeInactive);
  res.json({ success: true, data: result });
});

// GET /api/categories/tree - Get category tree
router.get('/tree', async (_req: AuthenticatedRequest, res: Response) => {
  const result = await categoriesService.getCategoryTree();
  res.json({ success: true, data: result });
});

// GET /api/categories/:id - Get category by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const result = await categoriesService.getCategoryById(req.params.id);
  res.json({ success: true, data: result });
});

// POST /api/categories - Create category
router.post('/', requirePermission(PERMISSIONS.CATEGORIES_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  // Convert "none" to null for parentId
  if (req.body.parentId === 'none') {
    req.body.parentId = null;
  }
  const input = createCategorySchema.parse(req.body);
  const result = await categoriesService.createCategory(input);
  res.status(201).json({ success: true, data: result });
});

// PUT /api/categories/:id - Update category
router.put('/:id', requirePermission(PERMISSIONS.CATEGORIES_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  // Convert "none" to null for parentId
  if (req.body.parentId === 'none') {
    req.body.parentId = null;
  }
  const input = updateCategorySchema.parse(req.body);
  const result = await categoriesService.updateCategory(req.params.id, input);
  res.json({ success: true, data: result });
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', requirePermission(PERMISSIONS.CATEGORIES_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const result = await categoriesService.deleteCategory(req.params.id);
  res.json({ success: true, ...result });
});

export { router as categoriesRouter };

