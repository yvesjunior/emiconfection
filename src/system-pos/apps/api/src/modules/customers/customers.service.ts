import prisma from '../../config/database.js';
import { ApiError, PaginationQuery } from '../../common/types/index.js';
import { getPaginationParams, createPaginatedResponse } from '../../common/utils/pagination.js';
import { CreateCustomerInput, UpdateCustomerInput } from './customers.schema.js';

export async function getCustomers(query: PaginationQuery & { search?: string }) {
  const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(query);

  const where: any = {};

  if (query.search) {
    const searchTerm = query.search.trim();
    // Check if search is a phone number (only digits)
    const isPhoneNumber = /^\d+$/.test(searchTerm);
    
    if (isPhoneNumber) {
      // Prioritize phone number search
      where.phone = { contains: searchTerm, mode: 'insensitive' };
    } else {
      // Search in name, email, and phone
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: query.search && /^\d+$/.test(query.search.trim())
        ? [
            // If searching by phone, prioritize exact matches
            { phone: 'asc' },
            { [sortBy]: sortOrder },
          ]
        : { [sortBy]: sortOrder },
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

export async function redeemLoyaltyPoints(id: string, points: number) {
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  if (customer.loyaltyPoints < points) {
    throw ApiError.badRequest(`Insufficient loyalty points. Customer has ${customer.loyaltyPoints} points.`);
  }

  // Get conversion rate from SystemSettings (global settings, admin-only)
  const systemSettings = await prisma.systemSettings.findFirst();
  const conversionRate = systemSettings?.loyaltyPointsConversionRate
    ? Number(systemSettings.loyaltyPointsConversionRate)
    : 1.0; // Default: 1 point = 1 FCFA

  // Calculate discount amount
  const discountAmount = points * conversionRate;

  // Deduct points
  const updated = await prisma.customer.update({
    where: { id },
    data: { loyaltyPoints: { decrement: points } },
  });

  return {
    discountAmount,
    remainingPoints: updated.loyaltyPoints,
    pointsUsed: points,
  };
}

