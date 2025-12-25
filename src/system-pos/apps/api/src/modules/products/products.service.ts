import prisma from '../../config/database.js';
import { ApiError, PaginationQuery } from '../../common/types/index.js';
import { getPaginationParams, createPaginatedResponse } from '../../common/utils/pagination.js';
import { CreateProductInput, UpdateProductInput } from './products.schema.js';

interface ProductQuery extends PaginationQuery {
  search?: string;
  categoryId?: string;
  isActive?: string;
  warehouseId?: string;
}

export async function getProducts(query: ProductQuery) {
  const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(query);

  const where: any = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { sku: { contains: query.search, mode: 'insensitive' } },
      { barcode: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  // Filter by category (products that have this category in their categories)
  if (query.categoryId) {
    where.categories = {
      some: {
        categoryId: query.categoryId,
      },
    };
  }

  // Filter by active status
  // If isActive is explicitly set to 'false', show inactive products
  // If isActive is 'true' or undefined, show only active products
  if (query.isActive === 'false') {
    where.isActive = false;
  } else if (query.isActive === 'true') {
    where.isActive = true;
  } else {
    // Default: only show active products (for POS/sell mode)
    where.isActive = true;
  }

  const includeInventory = query.warehouseId
    ? {
        inventory: {
          where: { warehouseId: query.warehouseId },
          include: { warehouse: { select: { id: true, name: true, code: true, type: true } } },
        },
      }
    : {
        inventory: {
          include: { warehouse: { select: { id: true, name: true, code: true, type: true } } },
        },
      };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        categories: {
          include: {
            category: { select: { id: true, name: true, parentId: true } },
          },
        },
        ...includeInventory,
      },
    }),
    prisma.product.count({ where }),
  ]);

  // Transform to include flattened categories array
  const transformedProducts = products.map((product) => ({
    ...product,
    categories: product.categories.map((pc) => pc.category),
  }));

  return createPaginatedResponse(transformedProducts, total, page, limit);
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      categories: {
        include: {
          category: { select: { id: true, name: true, parentId: true } },
        },
      },
      inventory: {
        include: {
          warehouse: { select: { id: true, name: true, code: true, type: true } },
        },
      },
    },
  });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Transform to flatten categories
  return {
    ...product,
    categories: product.categories.map((pc) => pc.category),
  };
}

export async function getProductByBarcode(barcode: string) {
  const product = await prisma.product.findUnique({
    where: { barcode },
    include: {
      categories: {
        include: {
          category: { select: { id: true, name: true, parentId: true } },
        },
      },
      inventory: {
        include: {
          warehouse: { select: { id: true, name: true, code: true, type: true } },
        },
      },
    },
  });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Transform to flatten categories
  return {
    ...product,
    categories: product.categories.map((pc) => pc.category),
  };
}

export async function createProduct(input: CreateProductInput) {
  // Check if SKU already exists
  const existingSku = await prisma.product.findUnique({
    where: { sku: input.sku },
  });

  if (existingSku) {
    throw ApiError.conflict('SKU already exists');
  }

  // Check if barcode already exists
  if (input.barcode) {
    const existingBarcode = await prisma.product.findUnique({
      where: { barcode: input.barcode },
    });

    if (existingBarcode) {
      throw ApiError.conflict('Barcode already exists');
    }
  }

  // Build category IDs array (support both single and multiple)
  const categoryIds = input.categoryIds || (input.categoryId ? [input.categoryId] : []);

  // Verify all categories exist
  const existingCategories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });

  if (existingCategories.length !== categoryIds.length) {
    throw ApiError.badRequest('One or more categories not found');
  }

  // Extract stock-related fields
  const { categoryId, categoryIds: _, stock, minStockLevel, warehouseId, ...productData } = input;

  // Get default warehouse if not specified
  let targetWarehouseId = warehouseId;
  if (!targetWarehouseId) {
    const defaultWarehouse = await prisma.warehouse.findFirst({
      where: { isDefault: true, isActive: true },
    });
    if (defaultWarehouse) {
      targetWarehouseId = defaultWarehouse.id;
    }
  }

  const product = await prisma.product.create({
    data: {
      sku: productData.sku,
      barcode: productData.barcode,
      name: productData.name,
      description: productData.description,
      costPrice: productData.costPrice,
      transportFee: productData.transportFee || 0,
      sellingPrice: productData.sellingPrice,
      unit: productData.unit,
      imageUrl: productData.imageUrl,
      isActive: productData.isActive,
      categories: {
        create: categoryIds.map((catId) => ({
          category: { connect: { id: catId } },
        })),
      },
    },
    include: {
      categories: {
        include: {
          category: { select: { id: true, name: true, parentId: true } },
        },
      },
    },
  });

  // Create inventory record if warehouse available
  if (targetWarehouseId) {
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: targetWarehouseId,
        quantity: stock || 0,
        minStockLevel: minStockLevel ?? 1,
      },
    });
  }

  return {
    ...product,
    categories: product.categories.map((pc) => pc.category),
    stock: stock || 0,
  };
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Check SKU uniqueness if changing
  if (input.sku && input.sku !== product.sku) {
    const existingSku = await prisma.product.findUnique({
      where: { sku: input.sku },
    });
    if (existingSku) {
      throw ApiError.conflict('SKU already exists');
    }
  }

  // Check barcode uniqueness if changing
  if (input.barcode && input.barcode !== product.barcode) {
    const existingBarcode = await prisma.product.findUnique({
      where: { barcode: input.barcode },
    });
    if (existingBarcode) {
      throw ApiError.conflict('Barcode already exists');
    }
  }

  // Build category IDs array if provided (support both single and multiple)
  const categoryIds = input.categoryIds || (input.categoryId ? [input.categoryId] : null);

  // Verify categories if changing
  if (categoryIds && categoryIds.length > 0) {
    const existingCategories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    if (existingCategories.length !== categoryIds.length) {
      throw ApiError.badRequest('One or more categories not found');
    }
  }

  // Extract category and stock fields from input
  const { categoryId, categoryIds: _, stock, minStockLevel, warehouseId, ...productData } = input;

  // Update product and categories in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Update product fields
    const updatedProduct = await tx.product.update({
      where: { id },
      data: productData,
    });

    // Update categories if provided
    if (categoryIds && categoryIds.length > 0) {
      // Delete existing category relations
      await tx.productCategory.deleteMany({
        where: { productId: id },
      });

      // Create new category relations
      await tx.productCategory.createMany({
        data: categoryIds.map((catId) => ({
          productId: id,
          categoryId: catId,
        })),
      });
    }

    // Update stock if provided
    if (stock !== undefined) {
      // Get target warehouse
      let targetWarehouseId = warehouseId;
      if (!targetWarehouseId) {
        const defaultWarehouse = await tx.warehouse.findFirst({
          where: { isDefault: true, isActive: true },
        });
        if (defaultWarehouse) {
          targetWarehouseId = defaultWarehouse.id;
        }
      }

      if (targetWarehouseId) {
        await tx.inventory.upsert({
          where: {
            productId_warehouseId: {
              productId: id,
              warehouseId: targetWarehouseId,
            },
          },
          update: {
            quantity: stock,
            ...(minStockLevel !== undefined && { minStockLevel }),
          },
          create: {
            productId: id,
            warehouseId: targetWarehouseId,
            quantity: stock,
            minStockLevel: minStockLevel ?? 1,
          },
        });
      }
    }

    // Fetch updated product with categories
    return tx.product.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: { select: { id: true, name: true, parentId: true } },
          },
        },
      },
    });
  });

  return {
    ...updated,
    categories: updated?.categories.map((pc) => pc.category) || [],
  };
}

export async function deleteProduct(id: string, employeeRoleName: string) {
  // Only admin can delete products from database
  if (employeeRoleName !== 'admin') {
    throw ApiError.forbidden('Only administrators can delete products from the database');
  }

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Check if product has been used in sales
  const saleItemsCount = await prisma.saleItem.count({
    where: { productId: id },
  });

  if (saleItemsCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete product that has been used in ${saleItemsCount} sale(s). The product must remain for historical records.`
    );
  }

  // Check if product has been used in purchase orders
  const purchaseOrderItemsCount = await prisma.purchaseOrderItem.count({
    where: { productId: id },
  });

  if (purchaseOrderItemsCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete product that has been used in ${purchaseOrderItemsCount} purchase order(s). The product must remain for historical records.`
    );
  }

  // Hard delete - delete the product and all related data in a transaction
  // Prisma will cascade delete:
  // - ProductCategory (onDelete: Cascade)
  // - Inventory (onDelete: Cascade)
  // StockMovements will remain for audit trail (no cascade, but we'll handle them)
  await prisma.$transaction(async (tx) => {
    // Delete stock movements first (they don't have cascade)
    await tx.stockMovement.deleteMany({
      where: { productId: id },
    });

    // Delete the product (cascades to ProductCategory and Inventory)
    await tx.product.delete({
      where: { id },
    });
  });

  return { message: 'Product deleted successfully' };
}

