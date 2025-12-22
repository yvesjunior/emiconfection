import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requirePermission, getWarehouseScope } from '../../common/middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import * as expensesService from './expenses.service.js';
import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  createExpenseSchema,
  updateExpenseSchema,
  getExpensesQuerySchema,
} from './expenses.schema.js';

const router = Router();

router.use(authenticate);

// ============================================
// EXPENSE CATEGORIES
// ============================================

// GET /api/expenses/categories - List expense categories
router.get('/categories', requirePermission(PERMISSIONS.EXPENSES_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true';
  const result = await expensesService.getExpenseCategories(includeInactive);
  res.json({ success: true, data: result });
});

// GET /api/expenses/categories/:id - Get category by ID
router.get('/categories/:id', requirePermission(PERMISSIONS.EXPENSES_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const result = await expensesService.getExpenseCategoryById(req.params.id);
  res.json({ success: true, data: result });
});

// POST /api/expenses/categories - Create category
router.post('/categories', requirePermission(PERMISSIONS.EXPENSES_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const input = createExpenseCategorySchema.parse(req.body);
  const result = await expensesService.createExpenseCategory(input);
  res.status(201).json({ success: true, data: result });
});

// PUT /api/expenses/categories/:id - Update category
router.put('/categories/:id', requirePermission(PERMISSIONS.EXPENSES_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const input = updateExpenseCategorySchema.parse(req.body);
  const result = await expensesService.updateExpenseCategory(req.params.id, input);
  res.json({ success: true, data: result });
});

// DELETE /api/expenses/categories/:id - Delete category
router.delete('/categories/:id', requirePermission(PERMISSIONS.EXPENSES_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const result = await expensesService.deleteExpenseCategory(req.params.id);
  res.json({ success: true, ...result });
});

// ============================================
// EXPENSES
// ============================================

// GET /api/expenses - List expenses
router.get('/', requirePermission(PERMISSIONS.EXPENSES_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const query = getExpensesQuerySchema.parse(req.query);
  const warehouseId = getWarehouseScope(req);
  const result = await expensesService.getExpenses(query, warehouseId);
  res.json({ success: true, ...result });
});

// GET /api/expenses/summary - Get expense summary
router.get('/summary', requirePermission(PERMISSIONS.EXPENSES_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const warehouseId = getWarehouseScope(req);
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  const result = await expensesService.getExpenseSummary(warehouseId, startDate, endDate);
  res.json({ success: true, data: result });
});

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', requirePermission(PERMISSIONS.EXPENSES_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const result = await expensesService.getExpenseById(req.params.id);
  res.json({ success: true, data: result });
});

// POST /api/expenses - Create expense
router.post('/', requirePermission(PERMISSIONS.EXPENSES_CREATE), async (req: AuthenticatedRequest, res: Response) => {
  const input = createExpenseSchema.parse(req.body);
  const employeeId = req.employee!.id;
  const warehouseId = req.employee!.warehouseId || input.warehouseId;
  
  if (!warehouseId) {
    res.status(400).json({ success: false, message: 'Warehouse is required' });
    return;
  }

  const result = await expensesService.createExpense(input, employeeId, warehouseId);
  res.status(201).json({ success: true, data: result });
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', requirePermission(PERMISSIONS.EXPENSES_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const input = updateExpenseSchema.parse(req.body);
  const result = await expensesService.updateExpense(req.params.id, input);
  res.json({ success: true, data: result });
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', requirePermission(PERMISSIONS.EXPENSES_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const result = await expensesService.deleteExpense(req.params.id);
  res.json({ success: true, ...result });
});

export { router as expensesRouter };

