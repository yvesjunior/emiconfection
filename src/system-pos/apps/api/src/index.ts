import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { errorHandler } from './common/middleware/error-handler.js';
import { requestLogger } from './common/middleware/request-logger.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { employeesRouter } from './modules/employees/employees.routes.js';
import { rolesRouter } from './modules/roles/roles.routes.js';
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { warehousesRouter } from './modules/warehouses/warehouses.routes.js';
import { inventoryRouter } from './modules/inventory/inventory.routes.js';
import { customersRouter } from './modules/customers/customers.routes.js';
import { shiftsRouter } from './modules/shifts/shifts.routes.js';
import { salesRouter } from './modules/sales/sales.routes.js';
import { settingsRouter } from './modules/settings/settings.routes.js';
import { expensesRouter } from './modules/expenses/expenses.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API root - info endpoint
app.get('/api', (_req, res) => {
  res.json({
    name: 'POS System API',
    version: '1.0.0',
    status: 'ok',
    endpoints: [
      '/api/auth',
      '/api/employees',
      '/api/roles',
      '/api/categories',
      '/api/products',
      '/api/warehouses',
      '/api/inventory',
      '/api/customers',
      '/api/shifts',
      '/api/sales',
      '/api/settings',
      '/api/expenses',
    ],
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/warehouses', warehousesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/customers', customersRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/expenses', expensesRouter);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 POS API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;

