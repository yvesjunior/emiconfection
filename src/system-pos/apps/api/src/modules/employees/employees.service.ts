import bcrypt from 'bcryptjs';
import prisma from '../../config/database.js';
import { ApiError, PaginationQuery } from '../../common/types/index.js';
import { getPaginationParams, createPaginatedResponse } from '../../common/utils/pagination.js';
import { CreateEmployeeInput, UpdateEmployeeInput, ResetPinInput } from './employees.schema.js';

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
  if (currentEmployeeRole === 'manager') {
    // Manager can only create Sellers
    if (role.name !== 'cashier') {
      throw ApiError.forbidden('You can only create Sellers for your assigned warehouses');
    }

    // Manager can only assign to their own warehouse
    if (currentEmployeeId) {
      const currentEmployee = await prisma.employee.findUnique({
        where: { id: currentEmployeeId },
        include: { warehouse: true },
      });

      if (!currentEmployee?.warehouseId) {
        throw ApiError.forbidden('You must be assigned to a warehouse to create employees');
      }

      if (input.warehouseId !== currentEmployee.warehouseId) {
        throw ApiError.forbidden('You can only create employees for your assigned warehouse');
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
    include: { role: true, warehouse: true },
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  // Apply hierarchy restrictions
  if (currentEmployeeRole === 'manager') {
    // Manager cannot modify Managers or Admins
    if (employee.role.name === 'manager' || employee.role.name === 'admin') {
      throw ApiError.forbidden('You cannot modify Managers or Administrators. You can only manage Sellers assigned to your warehouse.');
    }

    // Manager can only modify Sellers from their warehouse
    if (currentEmployeeId) {
      const currentEmployee = await prisma.employee.findUnique({
        where: { id: currentEmployeeId },
        include: { warehouse: true },
      });

      if (!currentEmployee?.warehouseId) {
        throw ApiError.forbidden('You must be assigned to a warehouse to modify employees');
      }

      if (employee.warehouseId !== currentEmployee.warehouseId) {
        throw ApiError.forbidden('You can only modify employees from your assigned warehouse');
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
    }
  } else if (currentEmployeeRole === 'cashier') {
    // Seller cannot modify any employees
    throw ApiError.forbidden('You do not have permission to modify employees');
  }
  // Admin can modify all (no restriction)

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

export async function deleteEmployee(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found');
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


