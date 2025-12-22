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
  
  // Expenses
  EXPENSES_VIEW: 'expenses:view',
  EXPENSES_CREATE: 'expenses:create',
  EXPENSES_MANAGE: 'expenses:manage',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type Permission = typeof PERMISSIONS[PermissionKey];

