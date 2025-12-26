import { Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtPayload, ApiError } from '../types/index.js';
import prisma from '../../config/database.js';

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;

    if (decoded.type !== 'access') {
      throw ApiError.unauthorized('Invalid token type');
    }

    // Get employee with role and permissions
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.employeeId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!employee || !employee.isActive) {
      throw ApiError.unauthorized('Employee not found or inactive');
    }

    // Extract permission names
    const permissions = employee.role.permissions.map(
      (rp) => rp.permission.name
    );

    req.employee = {
      id: employee.id,
      phone: employee.phone,
      roleId: employee.roleId,
      roleName: employee.role.name,
      warehouseId: employee.warehouseId,
      permissions,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Token expired');
    }
    throw error;
  }
}

export function requirePermission(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.employee) {
      throw ApiError.unauthorized();
    }

    // Admin has all permissions
    if (req.employee.roleName === 'admin') {
      next();
      return;
    }

    const hasPermission = requiredPermissions.some((permission) =>
      req.employee!.permissions.includes(permission)
    );

    if (!hasPermission) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  };
}

/**
 * Middleware that requires permission AND warehouse access for managers.
 * For managers, checks if they have access to the warehouse specified in the request.
 * For admins, only checks permission (they have access to all warehouses).
 * 
 * @param requiredPermissions - The permissions required
 * @param getWarehouseId - Function to extract warehouse ID from request (body, params, or query)
 */
export function requirePermissionAndWarehouseAccess(
  ...requiredPermissions: string[]
) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.employee) {
      throw ApiError.unauthorized();
    }

    // Admin has all permissions and access to all warehouses
    if (req.employee.roleName === 'admin') {
      const hasPermission = requiredPermissions.some((permission) =>
        req.employee!.permissions.includes(permission)
      );
      if (!hasPermission) {
        throw ApiError.forbidden('Insufficient permissions');
      }
      next();
      return;
    }

    // Check permission first
    const hasPermission = requiredPermissions.some((permission) =>
      req.employee!.permissions.includes(permission)
    );

    if (!hasPermission) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    // For managers, check warehouse access if warehouseId is provided
    // Extract warehouseId from body, params, or query
    const warehouseId = req.body?.warehouseId || req.params?.warehouseId || req.query?.warehouseId;
    
    if (warehouseId && req.employee.roleName === 'manager') {
      const hasAccess = await validateWarehouseAccess(req.employee.id, warehouseId as string);
      if (!hasAccess) {
        throw ApiError.forbidden('You do not have access to this warehouse');
      }
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.employee) {
      throw ApiError.unauthorized();
    }

    if (!roles.includes(req.employee.roleName)) {
      throw ApiError.forbidden('Insufficient role');
    }

    next();
  };
}

/**
 * Middleware to require warehouse context.
 * Admin users can access all warehouses, others are restricted to their assigned warehouse.
 */
export function requireWarehouse() {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.employee) {
      throw ApiError.unauthorized();
    }

    // Admin can work without warehouse restriction
    if (req.employee.roleName === 'Admin') {
      next();
      return;
    }

    if (!req.employee.warehouseId) {
      throw ApiError.forbidden('No warehouse assigned');
    }

    next();
  };
}

/**
 * Helper to get warehouse ID from request for READING/FILTERING.
 * Returns the employee's warehouse or null for admins (who can see all).
 * Admins can select a specific warehouse via header or query param.
 */
export function getWarehouseScope(req: AuthenticatedRequest): string | null {
  if (!req.employee) return null;
  
  // Admin can see all warehouses, but can filter by specific one
  if (req.employee.roleName === 'Admin') {
    // Check header first (set by frontend), then query param
    const headerWarehouseId = req.headers['x-warehouse-id'] as string | undefined;
    const queryWarehouseId = req.query.warehouseId as string | undefined;
    return headerWarehouseId || queryWarehouseId || null;
  }
  
  // Non-admins are restricted to their assigned warehouse
  return req.employee.warehouseId;
}

/**
 * Helper to get warehouse ID for CREATING items.
 * Uses selected warehouse (from header) or falls back to employee's assigned warehouse.
 * Throws error if no warehouse can be determined.
 */
export function getWarehouseForCreate(req: AuthenticatedRequest): string {
  if (!req.employee) {
    throw ApiError.unauthorized();
  }
  
  // First check header (selected warehouse from UI)
  const headerWarehouseId = req.headers['x-warehouse-id'] as string | undefined;
  if (headerWarehouseId) {
    return headerWarehouseId;
  }
  
  // Fall back to employee's assigned warehouse
  if (req.employee.warehouseId) {
    return req.employee.warehouseId;
  }
  
  // For admins without a selected warehouse, this is an error for create operations
  throw ApiError.badRequest('Please select a warehouse before creating items');
}

/**
 * Validates if an employee has access to a specific warehouse.
 * Admin has access to all warehouses.
 * Other employees must have the warehouse in their assigned warehouses list.
 * 
 * @param employeeId - The employee ID
 * @param warehouseId - The warehouse ID to check access for
 * @returns Promise<boolean> - True if employee has access, false otherwise
 */
export async function validateWarehouseAccess(
  employeeId: string,
  warehouseId: string
): Promise<boolean> {
  // Get employee with role and warehouse assignments
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      role: true,
      warehouses: {
        select: { warehouseId: true },
      },
    },
  });

  if (!employee) {
    return false;
  }

  // Admin has access to all warehouses (case-insensitive check)
  if (employee.role.name.toLowerCase() === 'admin') {
    return true;
  }

  // Check if warehouse is in assigned warehouses (many-to-many)
  const hasAssignedWarehouse = employee.warehouses.some(
    (ew) => ew.warehouseId === warehouseId
  );

  if (hasAssignedWarehouse) {
    return true;
  }

  // Also check primary warehouseId for backward compatibility
  if (employee.warehouseId === warehouseId) {
    return true;
  }

  return false;
}

/**
 * Validates warehouse access and throws error if access denied.
 * Use this in service functions to enforce warehouse access control.
 * 
 * @param employeeId - The employee ID
 * @param warehouseId - The warehouse ID to check access for
 * @throws ApiError.forbidden if employee doesn't have access
 */
export async function requireWarehouseAccess(
  employeeId: string,
  warehouseId: string
): Promise<void> {
  const hasAccess = await validateWarehouseAccess(employeeId, warehouseId);
  
  if (!hasAccess) {
    throw ApiError.forbidden(
      'You do not have access to manage inventory for this warehouse'
    );
  }
}

