import prisma from '../../config/database.js';
import { ApiError } from '../../common/types/index.js';
import { FinancialReportQuery } from './reports.schema.js';

function getDateRange(period?: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now);

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else if (period) {
    switch (period) {
      case 'day':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
    }
  } else {
    // Default to today
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

export async function getFinancialReport(
  query: FinancialReportQuery,
  employeeRole: string,
  employeeId?: string
) {
  const { warehouseId, period, startDate, endDate } = query;

  // Determine warehouse filter based on role
  let warehouseFilter: string[] | undefined;

  if (employeeRole === 'manager' && employeeId) {
    // Manager sees only their assigned warehouses
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { warehouse: true },
    });

    if (employee?.warehouseId) {
      warehouseFilter = [employee.warehouseId];
    } else {
      // Manager with no warehouse sees nothing
      return {
        period: period || 'day',
        startDate: startDate || new Date().toISOString(),
        endDate: endDate || new Date().toISOString(),
        totalSales: 0,
        totalExpenses: 0,
        netProfit: 0,
        transactionCount: 0,
        byWarehouse: [],
      };
    }
  } else if (warehouseId) {
    // Specific warehouse requested
    warehouseFilter = [warehouseId];
  } else if (employeeRole === 'admin') {
    // Admin sees all warehouses (no filter)
    warehouseFilter = undefined;
  } else {
    // Default: no filter (will be empty for non-admin)
    warehouseFilter = undefined;
  }

  const { start, end } = getDateRange(period, startDate, endDate);

  // Build where clauses
  const salesWhere: any = {
    createdAt: { gte: start, lte: end },
    status: 'completed',
  };

  const expensesWhere: any = {
    date: { gte: start, lte: end },
  };

  if (warehouseFilter) {
    salesWhere.warehouseId = { in: warehouseFilter };
    expensesWhere.warehouseId = { in: warehouseFilter };
  }

  // Get sales totals
  const salesAggregate = await prisma.sale.aggregate({
    where: salesWhere,
    _sum: { total: true },
    _count: { id: true },
  });

  const totalSales = Number(salesAggregate._sum.total || 0);
  const transactionCount = salesAggregate._count.id;

  // Get expenses totals
  const expensesAggregate = await prisma.expense.aggregate({
    where: expensesWhere,
    _sum: { amount: true },
  });

  const totalExpenses = Number(expensesAggregate._sum.amount || 0);
  const netProfit = totalSales - totalExpenses;

  // Get breakdown by warehouse (only if admin or multiple warehouses)
  let byWarehouse: any[] = [];
  if (employeeRole === 'admin' || !warehouseFilter || warehouseFilter.length > 1) {
    const warehouses = warehouseFilter
      ? await prisma.warehouse.findMany({
          where: { id: { in: warehouseFilter } },
        })
      : await prisma.warehouse.findMany({ where: { isActive: true } });

    for (const warehouse of warehouses) {
      const warehouseSales = await prisma.sale.aggregate({
        where: {
          ...salesWhere,
          warehouseId: warehouse.id,
        },
        _sum: { total: true },
        _count: { id: true },
      });

      const warehouseExpenses = await prisma.expense.aggregate({
        where: {
          ...expensesWhere,
          warehouseId: warehouse.id,
        },
        _sum: { amount: true },
      });

      byWarehouse.push({
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        warehouseCode: warehouse.code,
        totalSales: Number(warehouseSales._sum.total || 0),
        totalExpenses: Number(warehouseExpenses._sum.amount || 0),
        netProfit: Number(warehouseSales._sum.total || 0) - Number(warehouseExpenses._sum.amount || 0),
        transactionCount: warehouseSales._count.id,
      });
    }
  }

  return {
    period: period || 'day',
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    totalSales,
    totalExpenses,
    netProfit,
    transactionCount,
    byWarehouse,
  };
}

