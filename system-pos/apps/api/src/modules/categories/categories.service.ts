import prisma from '../../config/database.js';
import { ApiError } from '../../common/types/index.js';
import { CreateCategoryInput, UpdateCategoryInput } from './categories.schema.js';

export async function getCategories(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true };

  const categories = await prisma.category.findMany({
    where,
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { products: true, children: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return categories;
}

export async function getCategoryTree() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { products: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  // Build tree structure
  const categoryMap = new Map();
  const roots: any[] = [];

  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id);
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      categoryMap.get(cat.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true } },
      _count: { select: { products: true } },
    },
  });

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  return category;
}

export async function createCategory(input: CreateCategoryInput) {
  // Verify parent exists if provided
  if (input.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: input.parentId },
    });
    if (!parent) {
      throw ApiError.badRequest('Parent category not found');
    }
  }

  const category = await prisma.category.create({
    data: input,
    include: {
      parent: { select: { id: true, name: true } },
    },
  });

  return category;
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  // Prevent setting self as parent
  if (input.parentId === id) {
    throw ApiError.badRequest('Category cannot be its own parent');
  }

  // Verify parent exists if provided
  if (input.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: input.parentId },
    });
    if (!parent) {
      throw ApiError.badRequest('Parent category not found');
    }
  }

  const updated = await prisma.category.update({
    where: { id },
    data: input,
    include: {
      parent: { select: { id: true, name: true } },
    },
  });

  return updated;
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true, children: true } },
    },
  });

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  if (category._count.products > 0) {
    throw ApiError.badRequest('Cannot delete category with products');
  }

  if (category._count.children > 0) {
    throw ApiError.badRequest('Cannot delete category with subcategories');
  }

  await prisma.category.delete({ where: { id } });

  return { message: 'Category deleted successfully' };
}

