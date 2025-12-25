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
      { email: { contains: query.search, mode: 'insensitive' } },
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
    // Manager can only see Sellers assigned to their warehouses
    const currentEmployee = await prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { warehouse: true },
    });

    if (currentEmployee?.warehouseId) {
      where.warehouseId = currentEmployee.warehouseId;
      // Only show Sellers (cashier role)
      const sellerRole = await prisma.role.findFirst({
        where: { name: 'cashier' },
      });
      if (sellerRole) {
        where.roleId = sellerRole.id;
      }
    } else {
      // Manager with no warehouse sees nothing
      return createPaginatedResponse([], 0, page, limit);
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
      },
    }),
    prisma.employee.count({ where }),
  ]);

  // Remove sensitive fields
  const sanitized = employees.map(({ password, pinCode, ...rest }) => rest);

  return createPaginatedResponse(sanitized, total, page, limit);
}

export async function getEmployeeById(id: string) {
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
    },
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  const { password, pinCode, ...rest } = employee;
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

  // Check if email already exists (only if email is provided)
  if (input.email) {
    const existingEmail = await prisma.employee.findFirst({
      where: { email: input.email },
    });

    if (existingEmail) {
      throw ApiError.conflict('Email already in use');
    }
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
  if (role.name !== 'admin' && !input.warehouseId) {
    throw ApiError.badRequest('Warehouse is required for non-admin roles');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // Hash PIN if provided
  let hashedPin = null;
  if (input.pinCode) {
    hashedPin = await bcrypt.hash(input.pinCode, 10);
  }

  const employee = await prisma.employee.create({
    data: {
      ...input,
      password: hashedPassword,
      pinCode: hashedPin,
    },
    include: {
      role: { select: { id: true, name: true } },
      warehouse: { select: { id: true, name: true, code: true } },
    },
  });

  const { password, pinCode, ...rest } = employee;
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
      throw ApiError.forbidden('You cannot modify Managers or Administrators');
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

      // If changing role, ensure it's still a Seller
      if (input.roleId) {
        const newRole = await prisma.role.findUnique({
          where: { id: input.roleId },
        });
        if (newRole && newRole.name !== 'cashier') {
          throw ApiError.forbidden('You can only assign the Seller role');
        }
      }

      // If changing warehouse, ensure it's still their warehouse
      if (input.warehouseId && input.warehouseId !== currentEmployee.warehouseId) {
        throw ApiError.forbidden('You can only assign employees to your assigned warehouse');
      }
    }
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

  // Check email uniqueness if changing
  if (input.email && input.email !== employee.email) {
    const existingEmail = await prisma.employee.findFirst({
      where: { email: input.email },
    });
    if (existingEmail) {
      throw ApiError.conflict('Email already in use');
    }
  }

  // Hash new PIN if provided
  let updateData: any = { ...input };
  if (input.pinCode) {
    updateData.pinCode = await bcrypt.hash(input.pinCode, 10);
  }

  const updated = await prisma.employee.update({
    where: { id },
    data: updateData,
    include: {
      role: { select: { id: true, name: true } },
      warehouse: { select: { id: true, name: true, code: true } },
    },
  });

  const { password, pinCode, ...rest } = updated;
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

