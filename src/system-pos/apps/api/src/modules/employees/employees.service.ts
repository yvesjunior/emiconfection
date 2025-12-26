import bcrypt from 'bcryptjs';
import prisma from '../../config/database.js';
import { ApiError, PaginationQuery } from '../../common/types/index.js';
import { getPaginationParams, createPaginatedResponse } from '../../common/utils/pagination.js';
import { CreateEmployeeInput, UpdateEmployeeInput, ResetPinInput } from './employees.schema.js';
import { createUserCreationAlert } from '../alerts/alerts.helper.js';

export async function getEmployees(
  query: PaginationQuery & { search?: string; roleId?: string; isActive?: string },
  currentEmployeeId?: string,
  currentEmployeeRole?: string
) {
  const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(query);

  const where: any = {};

  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.roleId) {
    where.roleId = query.roleId;
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive === 'true';
  }

  // Apply hierarchy restrictions
  if (currentEmployeeRole === 'manager' && currentEmployeeId) {
    // Manager can see themselves and all Sellers assigned to their warehouses
    const currentEmployee = await prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { 
        warehouse: true,
        warehouses: {
          include: {
            warehouse: true
          }
        }
      },
    });

    if (!currentEmployee) {
      return createPaginatedResponse([], 0, page, limit);
    }

    // Get all warehouse IDs the manager is assigned to (primary + many-to-many)
    const managerWarehouseIds: string[] = [];
    if (currentEmployee.warehouseId) {
      managerWarehouseIds.push(currentEmployee.warehouseId);
    }
    currentEmployee.warehouses.forEach(ew => {
      if (!managerWarehouseIds.includes(ew.warehouseId)) {
        managerWarehouseIds.push(ew.warehouseId);
      }
    });

    if (managerWarehouseIds.length === 0) {
      // Manager with no warehouse assignment sees only themselves
      where.id = currentEmployeeId;
    } else {
      // Get seller role ID
      const sellerRole = await prisma.role.findFirst({
        where: { name: 'cashier' },
      });

      if (sellerRole) {
        // Show: manager themselves OR sellers from assigned warehouses
        // Sellers can be assigned via primary warehouseId OR via EmployeeWarehouse table
        where.OR = [
          { id: currentEmployeeId }, // Manager themselves
          {
            AND: [
              { roleId: sellerRole.id }, // Only sellers
              {
                OR: [
                  { warehouseId: { in: managerWarehouseIds } }, // Primary warehouse assignment
                  {
                    warehouses: {
                      some: {
                        warehouseId: { in: managerWarehouseIds }
                      }
                    }
                  }, // Many-to-many warehouse assignment
                ],
              },
            ],
          },
        ];
      } else {
        // If seller role doesn't exist, show only manager themselves
        where.id = currentEmployeeId;
      }
    }
  }
  // Admin sees all (no filter)

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        role: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        warehouses: {
          include: {
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
      },
    }),
    prisma.employee.count({ where }),
  ]);

  // Remove sensitive fields
  const sanitized = employees.map(({ pinCode, ...rest }) => rest);

  return createPaginatedResponse(sanitized, total, page, limit);
}

export async function getEmployeeById(
  id: string,
  currentEmployeeId?: string,
  currentEmployeeRole?: string
) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
      warehouse: { select: { id: true, name: true, code: true } },
      warehouses: {
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  // Apply hierarchy restrictions
  if (currentEmployeeRole === 'manager') {
    // Manager cannot view Admins or other Managers
    if (employee.role.name === 'admin' || employee.role.name === 'manager') {
      throw ApiError.forbidden('You do not have permission to view this employee');
    }
    // Manager can only view Sellers from their warehouse
    if (currentEmployeeId) {
      const currentEmployee = await prisma.employee.findUnique({
        where: { id: currentEmployeeId },
        include: { warehouse: true },
      });
      if (currentEmployee?.warehouseId && employee.warehouseId !== currentEmployee.warehouseId) {
        throw ApiError.forbidden('You can only view employees from your assigned warehouse');
      }
    }
  } else if (currentEmployeeRole === 'cashier') {
    // Seller cannot view Managers or Admins
    if (employee.role.name === 'admin' || employee.role.name === 'manager') {
      throw ApiError.forbidden('You do not have permission to view this employee');
    }
  }
  // Admin can view all (no restriction)

  const { pinCode, ...rest } = employee;
  return {
    ...rest,
    hasPin: !!pinCode,
  };
}

export async function createEmployee(
  input: CreateEmployeeInput,
  currentEmployeeId?: string,
  currentEmployeeRole?: string
) {
  // Check if phone already exists
  const existingPhone = await prisma.employee.findUnique({
    where: { phone: input.phone },
  });

  if (existingPhone) {
    throw ApiError.conflict('Phone number already in use');
  }


  // Verify role exists and check if warehouse is required
  const role = await prisma.role.findUnique({
    where: { id: input.roleId },
  });

  if (!role) {
    throw ApiError.badRequest('Invalid role');
  }

  // Apply hierarchy restrictions
  if (currentEmployeeRole === 'admin') {
    // Admin cannot create other admins
    if (role.name === 'admin') {
      throw ApiError.forbidden('You cannot create users with admin role');
    }
  } else if (currentEmployeeRole === 'manager') {
    // Manager can only create Sellers
    if (role.name !== 'cashier') {
      throw ApiError.forbidden('You can only create Sellers for your assigned warehouses');
    }

    // Manager can only assign to their assigned warehouses
    if (currentEmployeeId) {
      const currentEmployee = await prisma.employee.findUnique({
        where: { id: currentEmployeeId },
        include: { 
          warehouse: true,
          warehouses: {
            include: { warehouse: true }
          }
        },
      });

      if (!currentEmployee) {
        throw ApiError.forbidden('You must be assigned to a warehouse to create employees');
      }

      // Get all warehouse IDs the manager is assigned to
      const managerWarehouseIds: string[] = [];
      if (currentEmployee.warehouseId) {
        managerWarehouseIds.push(currentEmployee.warehouseId);
      }
      currentEmployee.warehouses.forEach(ew => {
        if (!managerWarehouseIds.includes(ew.warehouseId)) {
          managerWarehouseIds.push(ew.warehouseId);
        }
      });

      if (managerWarehouseIds.length === 0) {
        throw ApiError.forbidden('You must be assigned to a warehouse to create employees');
      }

      // Check if the warehouse being assigned is one of the manager's warehouses
      const warehouseIds = input.warehouseIds || [];
      const allAssignedWarehouses = input.warehouseId 
        ? [input.warehouseId, ...warehouseIds]
        : warehouseIds;

      // At least one warehouse must be assigned for a Seller
      if (allAssignedWarehouses.length === 0) {
        throw ApiError.badRequest('At least one warehouse is required for Seller role');
      }

      const hasAccess = allAssignedWarehouses.every(whId => managerWarehouseIds.includes(whId));
      
      if (!hasAccess) {
        throw ApiError.forbidden('You can only create employees for your assigned warehouses');
      }
    }
  }

  // Admin doesn't require warehouse, but other roles do
  const warehouseIds = input.warehouseIds || [];
  if (role.name !== 'admin' && !input.warehouseId && warehouseIds.length === 0) {
    throw ApiError.badRequest('At least one warehouse is required for non-admin roles');
  }

  // Hash PIN if provided
  let hashedPin = null;
  if (input.pinCode) {
    hashedPin = await bcrypt.hash(input.pinCode, 10);
  }

  // Create employee with primary warehouse
  const employee = await prisma.employee.create({
    data: {
      phone: input.phone,
      pinCode: hashedPin,
      fullName: input.fullName,
      roleId: input.roleId,
      warehouseId: input.warehouseId || null,
      isActive: input.isActive ?? true,
      warehouses: {
        create: warehouseIds.map((warehouseId) => ({
          warehouseId,
        })),
      },
    },
    include: {
      role: { select: { id: true, name: true } },
      warehouse: { select: { id: true, name: true, code: true } },
      warehouses: {
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  // Get creator info for alert
  let creatorName = 'Admin';
  if (currentEmployeeId) {
    const creator = await prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      select: { fullName: true },
    });
    if (creator) {
      creatorName = creator.fullName;
    }
  }

  // Create alert for user creation
  setImmediate(async () => {
    try {
      await createUserCreationAlert(
        employee.id,
        employee.fullName,
        employee.role.name,
        creatorName
      );
    } catch (error) {
      console.error('Failed to create user creation alert:', error);
    }
  });

  const { pinCode, ...rest } = employee;
  return rest;
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
  currentEmployeeId?: string,
  currentEmployeeRole?: string
) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { 
      role: true, 
      warehouse: true,
      warehouses: {
        include: { warehouse: true }
      }
    },
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  // Apply hierarchy restrictions
  if (currentEmployeeRole === 'admin') {
    // Admin cannot modify other admins
    if (employee.role.name === 'admin') {
      throw ApiError.forbidden('You cannot modify users with admin role');
    }

    // Admin cannot change role to admin
    if (input.roleId) {
      const newRole = await prisma.role.findUnique({
        where: { id: input.roleId },
      });
      if (newRole && newRole.name === 'admin') {
        throw ApiError.forbidden('You cannot assign the admin role');
      }
    }
  } else if (currentEmployeeRole === 'manager') {
    // Manager cannot modify Managers or Admins
    if (employee.role.name === 'manager' || employee.role.name === 'admin') {
      throw ApiError.forbidden('You cannot modify Managers or Administrators. You can only manage Sellers assigned to your warehouses.');
    }

    // Manager can only modify Sellers from their assigned warehouses
    if (currentEmployeeId) {
      const currentEmployee = await prisma.employee.findUnique({
        where: { id: currentEmployeeId },
        include: { 
          warehouse: true,
          warehouses: {
            include: { warehouse: true }
          }
        },
      });

      if (!currentEmployee) {
        throw ApiError.forbidden('You must be assigned to a warehouse to modify employees');
      }

      // Get all warehouse IDs the manager is assigned to
      const managerWarehouseIds: string[] = [];
      if (currentEmployee.warehouseId) {
        managerWarehouseIds.push(currentEmployee.warehouseId);
      }
      currentEmployee.warehouses.forEach(ew => {
        if (!managerWarehouseIds.includes(ew.warehouseId)) {
          managerWarehouseIds.push(ew.warehouseId);
        }
      });

      if (managerWarehouseIds.length === 0) {
        throw ApiError.forbidden('You must be assigned to a warehouse to modify employees');
      }

      // Check if the employee is assigned to one of the manager's warehouses
      const employeeWarehouseIds: string[] = [];
      if (employee.warehouseId) {
        employeeWarehouseIds.push(employee.warehouseId);
      }
      employee.warehouses.forEach(ew => {
        if (!employeeWarehouseIds.includes(ew.warehouseId)) {
          employeeWarehouseIds.push(ew.warehouseId);
        }
      });

      const hasAccess = employeeWarehouseIds.some(whId => managerWarehouseIds.includes(whId));
      
      if (!hasAccess) {
        throw ApiError.forbidden('You can only modify employees assigned to your warehouses');
      }

      // If changing role, ensure it's still a Seller (cannot promote to Manager or Admin)
      if (input.roleId) {
        const newRole = await prisma.role.findUnique({
          where: { id: input.roleId },
        });
        if (newRole && newRole.name !== 'cashier') {
          throw ApiError.forbidden('You can only assign the Seller role. You cannot promote employees to Manager or Admin.');
        }
      }

      // If changing warehouse assignments, ensure they are within manager's warehouses
      if (input.warehouseIds !== undefined || input.warehouseId !== undefined) {
        const newWarehouseIds = input.warehouseIds || [];
        const newPrimaryWarehouse = input.warehouseId;
        const allNewWarehouses = newPrimaryWarehouse 
          ? [newPrimaryWarehouse, ...newWarehouseIds]
          : newWarehouseIds;

        const hasAccessToNewWarehouses = allNewWarehouses.every(whId => managerWarehouseIds.includes(whId));
        
        if (!hasAccessToNewWarehouses && allNewWarehouses.length > 0) {
          throw ApiError.forbidden('You can only assign employees to your warehouses');
        }
      }
    }
  } else if (currentEmployeeRole === 'cashier') {
    // Seller cannot modify any employees
    throw ApiError.forbidden('You do not have permission to modify employees');
  }

  // Check phone uniqueness if changing
  if (input.phone && input.phone !== employee.phone) {
    const existingPhone = await prisma.employee.findUnique({
      where: { phone: input.phone },
    });
    if (existingPhone) {
      throw ApiError.conflict('Phone number already in use');
    }
  }


  // Hash new PIN if provided
  let updateData: any = { ...input };
  if (input.pinCode) {
    updateData.pinCode = await bcrypt.hash(input.pinCode, 10);
  }

  // Remove warehouseIds from updateData as we'll handle it separately
  const warehouseIds = updateData.warehouseIds;
  delete updateData.warehouseIds;

  // Update employee basic fields
  const updated = await prisma.employee.update({
    where: { id },
    data: updateData,
    include: {
      role: { select: { id: true, name: true } },
      warehouse: { select: { id: true, name: true, code: true } },
      warehouses: {
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  // Update warehouse assignments if provided
  if (warehouseIds !== undefined) {
    // Delete existing assignments
    await prisma.employeeWarehouse.deleteMany({
      where: { employeeId: id },
    });

    // Create new assignments
    if (warehouseIds.length > 0) {
      await prisma.employeeWarehouse.createMany({
        data: warehouseIds.map((warehouseId: string) => ({
          employeeId: id,
          warehouseId,
        })),
      });
    }

    // Reload employee with updated warehouses
    const reloaded = await prisma.employee.findUnique({
      where: { id },
      include: {
        role: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        warehouses: {
          include: {
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (reloaded) {
      const { pinCode, ...rest } = reloaded;
      return rest;
    }
  }

  const { pinCode, ...rest } = updated;
  return rest;
}

export async function deleteEmployee(
  id: string,
  currentEmployeeId?: string,
  currentEmployeeRole?: string
) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      role: true,
      warehouse: true,
      warehouses: {
        include: { warehouse: true }
      }
    },
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  // Apply hierarchy restrictions
  if (currentEmployeeRole === 'admin') {
    // Admin cannot delete/deactivate other admins
    if (employee.role.name === 'admin') {
      throw ApiError.forbidden('You cannot delete or deactivate users with admin role');
    }
  } else if (currentEmployeeRole === 'manager') {
    // Manager cannot delete/deactivate Managers or Admins
    if (employee.role.name === 'manager' || employee.role.name === 'admin') {
      throw ApiError.forbidden('You cannot delete or deactivate Managers or Administrators. You can only manage Sellers assigned to your warehouses.');
    }

    // Manager can only delete/deactivate Sellers from their assigned warehouses
    if (currentEmployeeId) {
      const currentEmployee = await prisma.employee.findUnique({
        where: { id: currentEmployeeId },
        include: { 
          warehouse: true,
          warehouses: {
            include: { warehouse: true }
          }
        },
      });

      if (!currentEmployee) {
        throw ApiError.forbidden('You must be assigned to a warehouse to delete employees');
      }

      // Get all warehouse IDs the manager is assigned to
      const managerWarehouseIds: string[] = [];
      if (currentEmployee.warehouseId) {
        managerWarehouseIds.push(currentEmployee.warehouseId);
      }
      currentEmployee.warehouses.forEach(ew => {
        if (!managerWarehouseIds.includes(ew.warehouseId)) {
          managerWarehouseIds.push(ew.warehouseId);
        }
      });

      if (managerWarehouseIds.length === 0) {
        throw ApiError.forbidden('You must be assigned to a warehouse to delete employees');
      }

      // Check if the employee is assigned to one of the manager's warehouses
      const employeeWarehouseIds: string[] = [];
      if (employee.warehouseId) {
        employeeWarehouseIds.push(employee.warehouseId);
      }
      employee.warehouses.forEach(ew => {
        if (!employeeWarehouseIds.includes(ew.warehouseId)) {
          employeeWarehouseIds.push(ew.warehouseId);
        }
      });

      const hasAccess = employeeWarehouseIds.some(whId => managerWarehouseIds.includes(whId));
      
      if (!hasAccess) {
        throw ApiError.forbidden('You can only delete employees assigned to your warehouses');
      }
    }
  } else if (currentEmployeeRole === 'cashier') {
    // Seller cannot delete any employees
    throw ApiError.forbidden('You do not have permission to delete employees');
  }

  // Soft delete - set inactive
  await prisma.employee.update({
    where: { id },
    data: { isActive: false },
  });

  return { message: 'Employee deactivated successfully' };
}

export async function resetPin(id: string, input: ResetPinInput) {
  const employee = await prisma.employee.findUnique({
    where: { id },
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  const hashedPin = await bcrypt.hash(input.newPin, 10);

  await prisma.employee.update({
    where: { id },
    data: { pinCode: hashedPin },
  });

  return { message: 'PIN reset successfully' };
}


