import bcrypt from 'bcryptjs';
import prisma from '../../config/database.js';
import { ApiError, PaginationQuery } from '../../common/types/index.js';
import { getPaginationParams, createPaginatedResponse } from '../../common/utils/pagination.js';
import { CreateEmployeeInput, UpdateEmployeeInput, ResetPinInput } from './employees.schema.js';

export async function getEmployees(query: PaginationQuery & { search?: string; roleId?: string; isActive?: string }) {
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

export async function createEmployee(input: CreateEmployeeInput) {
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

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  const employee = await prisma.employee.findUnique({
    where: { id },
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found');
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

