import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requirePermission } from '../../common/middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import * as employeesService from './employees.service.js';
import { createEmployeeSchema, updateEmployeeSchema, resetPinSchema } from './employees.schema.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/employees - List employees
router.get('/', requirePermission(PERMISSIONS.EMPLOYEES_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const result = await employeesService.getEmployees(req.query as any);
  res.json({ success: true, ...result });
});

// GET /api/employees/:id - Get employee by ID
router.get('/:id', requirePermission(PERMISSIONS.EMPLOYEES_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const result = await employeesService.getEmployeeById(req.params.id);
  res.json({ success: true, data: result });
});

// POST /api/employees - Create employee
router.post('/', requirePermission(PERMISSIONS.EMPLOYEES_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  // Convert "none" to null for warehouseId
  if (req.body.warehouseId === 'none') {
    req.body.warehouseId = null;
  }
  const input = createEmployeeSchema.parse(req.body);
  const result = await employeesService.createEmployee(input);
  res.status(201).json({ success: true, data: result });
});

// PUT /api/employees/:id - Update employee
router.put('/:id', requirePermission(PERMISSIONS.EMPLOYEES_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  // Convert "none" to null for warehouseId
  if (req.body.warehouseId === 'none') {
    req.body.warehouseId = null;
  }
  const input = updateEmployeeSchema.parse(req.body);
  const result = await employeesService.updateEmployee(req.params.id, input);
  res.json({ success: true, data: result });
});

// DELETE /api/employees/:id - Delete (deactivate) employee
router.delete('/:id', requirePermission(PERMISSIONS.EMPLOYEES_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const result = await employeesService.deleteEmployee(req.params.id);
  res.json({ success: true, ...result });
});

// PUT /api/employees/:id/pin - Reset employee PIN
router.put('/:id/pin', requirePermission(PERMISSIONS.EMPLOYEES_RESET_PIN), async (req: AuthenticatedRequest, res: Response) => {
  const input = resetPinSchema.parse(req.body);
  const result = await employeesService.resetPin(req.params.id, input);
  res.json({ success: true, ...result });
});

export { router as employeesRouter };

