import prisma from '../../config/database.js';
import { ApiError, PaginationQuery } from '../../common/types/index.js';
import { getPaginationParams, createPaginatedResponse } from '../../common/utils/pagination.js';
import { CreateCustomerInput, UpdateCustomerInput } from './customers.schema.js';

export async function getCustomers(query: PaginationQuery & { search?: string }) {
  const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(query);

  const where: any = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: { select: { sales: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return createPaginatedResponse(customers, total, page, limit);
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: { select: { sales: true } },
    },
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  return customer;
}

export async function getCustomerSales(id: string, query: PaginationQuery) {
  const { page, limit, skip } = getPaginationParams(query);

  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where: { customerId: id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, fullName: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.sale.count({ where: { customerId: id } }),
  ]);

  return createPaginatedResponse(sales, total, page, limit);
}

export async function createCustomer(input: CreateCustomerInput) {
  const customer = await prisma.customer.create({
    data: input,
  });

  return customer;
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: input,
  });

  return updated;
}

export async function deleteCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: { select: { sales: true } },
    },
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  if (customer._count.sales > 0) {
    throw ApiError.badRequest('Cannot delete customer with sales history');
  }

  await prisma.customer.delete({ where: { id } });

  return { message: 'Customer deleted successfully' };
}

export async function addLoyaltyPoints(id: string, points: number) {
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: { loyaltyPoints: { increment: points } },
  });

  return updated;
}

