import prisma from '../../config/database.js';
import { ApiError, PaginationQuery } from '../../common/types/index.js';
import { getPaginationParams, createPaginatedResponse } from '../../common/utils/pagination.js';
import { SHIFT_STATUS, PAYMENT_METHODS } from '../../config/constants.js';
import { StartShiftInput, EndShiftInput } from './shifts.schema.js';

interface ShiftQuery extends PaginationQuery {
  employeeId?: string;
  warehouseId?: string;
  status?: string;
}

export async function getShifts(query: ShiftQuery) {
  const { page, limit, skip } = getPaginationParams(query);

  const where: any = {};

  if (query.employeeId) {
    where.employeeId = query.employeeId;
  }

  if (query.warehouseId) {
    where.warehouseId = query.warehouseId;
  }

  if (query.status) {
    where.status = query.status;
  }

  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startTime: 'desc' },
      include: {
        employee: { select: { id: true, fullName: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        _count: { select: { sales: true } },
      },
    }),
    prisma.shift.count({ where }),
  ]);

  return createPaginatedResponse(shifts, total, page, limit);
}

export async function getCurrentShift(employeeId: string) {
  const shift = await prisma.shift.findFirst({
    where: {
      employeeId,
      status: SHIFT_STATUS.OPEN,
    },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      _count: { select: { sales: true } },
    },
  });

  return shift;
}

export async function getShiftById(id: string) {
  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, fullName: true } },
      warehouse: { select: { id: true, name: true, code: true } },
      sales: {
        include: {
          _count: { select: { items: true } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!shift) {
    throw ApiError.notFound('Shift not found');
  }

  // Calculate shift statistics
  const stats = await calculateShiftStats(id);

  return { ...shift, stats };
}

export async function getShiftSales(id: string, query: PaginationQuery) {
  const { page, limit, skip } = getPaginationParams(query);

  const shift = await prisma.shift.findUnique({
    where: { id },
  });

  if (!shift) {
    throw ApiError.notFound('Shift not found');
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where: { shiftId: id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
        payments: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.sale.count({ where: { shiftId: id } }),
  ]);

  return createPaginatedResponse(sales, total, page, limit);
}

export async function startShift(input: StartShiftInput, employeeId: string) {
  // Check if employee already has an open shift
  const existingShift = await prisma.shift.findFirst({
    where: {
      employeeId,
      status: SHIFT_STATUS.OPEN,
    },
  });

  if (existingShift) {
    throw ApiError.badRequest('You already have an open shift');
  }

  // Verify warehouse exists
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: input.warehouseId },
  });

  if (!warehouse || !warehouse.isActive) {
    throw ApiError.badRequest('Warehouse not found or inactive');
  }

  const shift = await prisma.shift.create({
    data: {
      employeeId,
      warehouseId: input.warehouseId,
      openingCash: input.openingCash,
      status: SHIFT_STATUS.OPEN,
    },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
    },
  });

  return shift;
}

export async function endShift(employeeId: string, input: EndShiftInput) {
  const shift = await prisma.shift.findFirst({
    where: {
      employeeId,
      status: SHIFT_STATUS.OPEN,
    },
  });

  if (!shift) {
    throw ApiError.badRequest('No open shift found');
  }

  // Calculate expected cash
  const stats = await calculateShiftStats(shift.id);
  const expectedCash = Number(shift.openingCash) + stats.cashTotal;
  const cashDifference = input.closingCash - expectedCash;

  const updated = await prisma.shift.update({
    where: { id: shift.id },
    data: {
      endTime: new Date(),
      closingCash: input.closingCash,
      expectedCash,
      cashDifference,
      status: SHIFT_STATUS.CLOSED,
      notes: input.notes,
    },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
    },
  });

  return { ...updated, stats };
}

async function calculateShiftStats(shiftId: string) {
  const sales = await prisma.sale.findMany({
    where: { shiftId, status: 'completed' },
    include: { payments: true },
  });

  let totalSales = 0;
  let cashTotal = 0;
  let mobileMoneyTotal = 0;
  let refundTotal = 0;

  for (const sale of sales) {
    totalSales += Number(sale.total);

    for (const payment of sale.payments) {
      const amount = Number(payment.amount);
      switch (payment.method) {
        case PAYMENT_METHODS.CASH:
          cashTotal += amount;
          break;
        case PAYMENT_METHODS.MOBILE_MONEY:
          mobileMoneyTotal += amount;
          break;
      }
    }
  }

  // Get refunds
  const refunds = await prisma.sale.findMany({
    where: { shiftId, status: 'refunded' },
  });

  for (const refund of refunds) {
    refundTotal += Number(refund.total);
  }

  return {
    salesCount: sales.length,
    totalSales,
    cashTotal,
    mobileMoneyTotal,
    refundCount: refunds.length,
    refundTotal,
    netTotal: totalSales - refundTotal,
  };
}

