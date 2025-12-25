import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requirePermission } from '../../common/middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import * as customersService from './customers.service.js';
import { createCustomerSchema, updateCustomerSchema } from './customers.schema.js';

const router = Router();

router.use(authenticate);

// GET /api/customers - List customers
router.get('/', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const result = await customersService.getCustomers(req.query as any);
  res.json({ success: true, ...result });
});

// GET /api/customers/:id - Get customer by ID
router.get('/:id', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const result = await customersService.getCustomerById(req.params.id);
  res.json({ success: true, data: result });
});

// GET /api/customers/:id/sales - Get customer's purchase history
router.get('/:id/sales', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const result = await customersService.getCustomerSales(req.params.id, req.query as any);
  res.json({ success: true, ...result });
});

// POST /api/customers - Create customer (quick add allowed for cashiers)
router.post('/', requirePermission(PERMISSIONS.CUSTOMERS_ADD_QUICK), async (req: AuthenticatedRequest, res: Response) => {
  const input = createCustomerSchema.parse(req.body);
  const result = await customersService.createCustomer(input);
  res.status(201).json({ success: true, data: result });
});

// PUT /api/customers/:id - Update customer (allowed for sellers with CUSTOMERS_ADD_QUICK)
router.put('/:id', requirePermission(PERMISSIONS.CUSTOMERS_MANAGE, PERMISSIONS.CUSTOMERS_ADD_QUICK), async (req: AuthenticatedRequest, res: Response) => {
  const input = updateCustomerSchema.parse(req.body);
  const result = await customersService.updateCustomer(req.params.id, input);
  res.json({ success: true, data: result });
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', requirePermission(PERMISSIONS.CUSTOMERS_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const result = await customersService.deleteCustomer(req.params.id);
  res.json({ success: true, ...result });
});

// POST /api/customers/:id/redeem-points - Redeem loyalty points for discount
router.post('/:id/redeem-points', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), async (req: AuthenticatedRequest, res: Response) => {
  const { points } = req.body;
  if (!points || typeof points !== 'number' || points <= 0) {
    res.status(400).json({ success: false, message: 'Invalid points value' });
    return;
  }
  const result = await customersService.redeemLoyaltyPoints(req.params.id, points);
  res.json({ success: true, data: result });
});

export { router as customersRouter };

