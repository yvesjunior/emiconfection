import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
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

// POST /api/categories - Create category (Admin only)
router.post('/', requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  // Convert "none" to null for parentId
  if (req.body.parentId === 'none') {
    req.body.parentId = null;
  }
  const input = createCategorySchema.parse(req.body);
  const result = await categoriesService.createCategory(input);
  res.status(201).json({ success: true, data: result });
});

// PUT /api/categories/:id - Update category (Admin only)
router.put('/:id', requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  // Convert "none" to null for parentId
  if (req.body.parentId === 'none') {
    req.body.parentId = null;
  }
  const input = updateCategorySchema.parse(req.body);
  const result = await categoriesService.updateCategory(req.params.id, input);
  res.json({ success: true, data: result });
});

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete('/:id', requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  const result = await categoriesService.deleteCategory(req.params.id);
  res.json({ success: true, ...result });
});

export { router as categoriesRouter };

