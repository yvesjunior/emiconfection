import prisma from '../../config/database.js';
import { ApiError } from '../../common/types/index.js';
import { CreateWarehouseInput, UpdateWarehouseInput } from './warehouses.schema.js';

export async function getWarehouses(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true };

  const warehouses = await prisma.warehouse.findMany({
    where,
    include: {
      _count: { select: { employees: true, inventory: true } },
    },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });

  return warehouses;
}

export async function getWarehouseById(id: string) {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      _count: { select: { employees: true, inventory: true } },
    },
  });

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found');
  }

  return warehouse;
}

export async function createWarehouse(input: CreateWarehouseInput) {
  // Check if code already exists
  const existing = await prisma.warehouse.findUnique({
    where: { code: input.code },
  });

  if (existing) {
    throw ApiError.conflict('Warehouse code already exists');
  }

  // If this is set as default, unset other defaults
  if (input.isDefault) {
    await prisma.warehouse.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const warehouse = await prisma.warehouse.create({
    data: input,
  });

  return warehouse;
}

export async function updateWarehouse(id: string, input: UpdateWarehouseInput) {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
  });

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found');
  }

  // Check code uniqueness if changing
  if (input.code && input.code !== warehouse.code) {
    const existing = await prisma.warehouse.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw ApiError.conflict('Warehouse code already exists');
    }
  }

  // If setting as default, unset other defaults
  if (input.isDefault) {
    await prisma.warehouse.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.warehouse.update({
    where: { id },
    data: input,
  });

  return updated;
}

export async function deleteWarehouse(id: string) {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      _count: { select: { employees: true, inventory: true, sales: true } },
    },
  });

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found');
  }

  if (warehouse._count.sales > 0) {
    throw ApiError.badRequest('Cannot delete warehouse with sales history');
  }

  if (warehouse.isDefault) {
    throw ApiError.badRequest('Cannot delete default warehouse');
  }

  // Soft delete
  await prisma.warehouse.update({
    where: { id },
    data: { isActive: false },
  });

  return { message: 'Warehouse deactivated successfully' };
}

