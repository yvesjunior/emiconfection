import prisma from '../../config/database.js';
import { ApiError } from '../../common/types/index.js';
import {
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  GetExpensesQuery,
} from './expenses.schema.js';

// ============================================
// EXPENSE CATEGORIES
// ============================================

export async function getExpenseCategories(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true };
  
  return prisma.expenseCategory.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { expenses: true },
      },
    },
  });
}

export async function getExpenseCategoryById(id: string) {
  const category = await prisma.expenseCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: { expenses: true },
      },
    },
  });

  if (!category) {
    throw ApiError.notFound('Expense category not found');
  }

  return category;
}

export async function createExpenseCategory(input: CreateExpenseCategoryInput) {
  return prisma.expenseCategory.create({
    data: {
      name: input.name,
      description: input.description,
      icon: input.icon,
      color: input.color,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateExpenseCategory(id: string, input: UpdateExpenseCategoryInput) {
  await getExpenseCategoryById(id);

  return prisma.expenseCategory.update({
    where: { id },
    data: input,
  });
}

export async function deleteExpenseCategory(id: string) {
  const category = await getExpenseCategoryById(id);

  // Check if category has expenses
  const expenseCount = await prisma.expense.count({
    where: { categoryId: id },
  });

  if (expenseCount > 0) {
    // Soft delete by deactivating
    await prisma.expenseCategory.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'Category deactivated (has associated expenses)' };
  }

  await prisma.expenseCategory.delete({ where: { id } });
  return { message: 'Category deleted successfully' };
}

// ============================================
// EXPENSES
// ============================================

export async function getExpenses(
  query: GetExpensesQuery,
  warehouseId?: string,
  employeeRole?: string,
  employeeId?: string
) {
  const { page, limit, categoryId, startDate, endDate, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {};

  // Filter by warehouse according to role
  if (employeeRole === 'manager' && employeeId) {
    // Manager sees only expenses from their assigned warehouse
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { warehouse: true },
    });

    if (employee?.warehouseId) {
      where.warehouseId = employee.warehouseId;
    } else {
      // Manager with no warehouse sees nothing
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  } else if (warehouseId) {
    // Admin or explicit warehouse filter
    where.warehouseId = warehouseId;
  } else if (query.warehouseId) {
    where.warehouseId = query.warehouseId;
  }
  // Admin without filter sees all

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      where.date.lte = new Date(endDate);
    }
  }

  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { reference: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        category: true,
        warehouse: true,
      },
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    data: expenses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getExpenseById(id: string) {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      category: true,
      warehouse: true,
    },
  });

  if (!expense) {
    throw ApiError.notFound('Expense not found');
  }

  return expense;
}

export async function createExpense(
  input: CreateExpenseInput,
  employeeId: string,
  employeeWarehouseId: string
) {
  // Use employee's warehouse if not specified
  const warehouseId = input.warehouseId || employeeWarehouseId;

  return prisma.expense.create({
    data: {
      categoryId: input.categoryId,
      warehouseId,
      amount: input.amount,
      description: input.description,
      reference: input.reference,
      date: input.date ? new Date(input.date) : new Date(),
      createdBy: employeeId,
    },
    include: {
      category: true,
      warehouse: true,
    },
  });
}

export async function updateExpense(id: string, input: UpdateExpenseInput) {
  await getExpenseById(id);

  return prisma.expense.update({
    where: { id },
    data: {
      ...(input.categoryId && { categoryId: input.categoryId }),
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.reference !== undefined && { reference: input.reference }),
      ...(input.date && { date: new Date(input.date) }),
    },
    include: {
      category: true,
      warehouse: true,
    },
  });
}

export async function deleteExpense(id: string) {
  await getExpenseById(id);
  await prisma.expense.delete({ where: { id } });
  return { message: 'Expense deleted successfully' };
}

// ============================================
// REPORTS & ANALYTICS
// ============================================

export async function getExpenseSummary(
  warehouseId?: string,
  startDate?: string,
  endDate?: string
) {
  const where: any = {};

  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  // Total by category
  const byCategory = await prisma.expense.groupBy({
    by: ['categoryId'],
    where,
    _sum: { amount: true },
    _count: true,
  });

  // Get category details
  const categoryIds = byCategory.map((b) => b.categoryId);
  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: categoryIds } },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const byCategoryWithDetails = byCategory.map((b) => ({
    category: categoryMap.get(b.categoryId),
    total: b._sum.amount,
    count: b._count,
  }));

  // Total
  const total = await prisma.expense.aggregate({
    where,
    _sum: { amount: true },
    _count: true,
  });

  // By month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyExpenses = await prisma.$queryRaw`
    SELECT 
      TO_CHAR(date, 'YYYY-MM') as month,
      SUM(amount) as total
    FROM expenses
    WHERE date >= ${sixMonthsAgo}
      ${warehouseId ? prisma.$queryRaw`AND warehouse_id = ${warehouseId}` : prisma.$queryRaw``}
    GROUP BY TO_CHAR(date, 'YYYY-MM')
    ORDER BY month DESC
  `;

  return {
    total: total._sum.amount || 0,
    count: total._count || 0,
    byCategory: byCategoryWithDetails,
    monthly: monthlyExpenses,
  };
}

