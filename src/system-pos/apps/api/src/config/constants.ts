export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
} as const;

export const PERMISSIONS = {
  // Products
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  
  // Categories
  CATEGORIES_MANAGE: 'categories:manage',
  
  // Inventory
  INVENTORY_MANAGE: 'inventory:manage',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_VIEW: 'inventory:view',
  
  // Warehouses
  WAREHOUSES_MANAGE: 'warehouses:manage',
  
  // Sales
  SALES_CREATE: 'sales:create',
  SALES_VIEW_OWN: 'sales:view_own',
  SALES_VIEW_ALL: 'sales:view_all',
  SALES_VOID: 'sales:void',
  SALES_REFUND: 'sales:refund',
  
  // Discounts
  DISCOUNT_APPLY: 'discount:apply',
  
  // Customers
  CUSTOMERS_MANAGE: 'customers:manage',
  CUSTOMERS_VIEW: 'customers:view',
  CUSTOMERS_ADD_QUICK: 'customers:add_quick',
  
  // Shifts
  SHIFTS_OWN: 'shifts:own',
  SHIFTS_VIEW_ALL: 'shifts:view_all',
  SHIFTS_OVERRIDE: 'shifts:override',
  
  // Employees
  EMPLOYEES_MANAGE: 'employees:manage',
  EMPLOYEES_VIEW: 'employees:view',
  EMPLOYEES_RESET_PIN: 'employees:reset_pin',
  
  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  
  // Settings
  SETTINGS_MANAGE: 'settings:manage',
  
  // Suppliers
  SUPPLIERS_MANAGE: 'suppliers:manage',
  
  // Purchases
  PURCHASES_MANAGE: 'purchases:manage',
  
  // Expenses
  EXPENSES_VIEW: 'expenses:view',
  EXPENSES_CREATE: 'expenses:create',
  EXPENSES_MANAGE: 'expenses:manage',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  MOBILE_MONEY: 'mobile_money',
} as const;

export const SALE_STATUS = {
  COMPLETED: 'completed',
  REFUNDED: 'refunded',
  VOIDED: 'voided',
} as const;

export const SHIFT_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
} as const;

export const STOCK_MOVEMENT_TYPES = {
  IN: 'in',
  OUT: 'out',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
} as const;

export const PO_STATUS = {
  DRAFT: 'draft',
  ORDERED: 'ordered',
  PARTIAL: 'partial',
  RECEIVED: 'received',
  CANCELLED: 'cancelled',
} as const;

