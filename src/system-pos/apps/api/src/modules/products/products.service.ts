import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/database.js';
import { ApiError, PaginationQuery } from '../../common/types/index.js';
import { getPaginationParams, createPaginatedResponse } from '../../common/utils/pagination.js';
import { requireWarehouseAccess } from '../../common/middleware/auth.js';
import { CreateProductInput, UpdateProductInput } from './products.schema.js';
import { createStockReductionAlert, createProductDeletionAlert } from '../alerts/alerts.helper.js';

interface ProductQuery extends PaginationQuery {
  search?: string;
  categoryId?: string;
  isActive?: string;
  warehouseId?: string;
}

export async function getProducts(query: ProductQuery) {
  const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(query);

  // DEBUG: Log warehouseId to help diagnose issues
  console.log('[getProducts] warehouseId from query:', query.warehouseId);

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

  // CRITICAL: If warehouseId is provided, we need to ensure all products show inventory for that warehouse
  // even if no inventory entry exists (should show 0 stock)
  if (query.warehouseId) {
    console.log('[getProducts] Filtering products for warehouse:', query.warehouseId);
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
          inventory: {
            where: { warehouseId: query.warehouseId },
            include: { warehouse: { select: { id: true, name: true, code: true, type: true } } },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Get warehouse info for virtual inventory entries
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: query.warehouseId },
      select: { id: true, name: true, code: true, type: true },
    });

    // Transform products to ensure all have inventory entry for the specified warehouse
    // If no inventory entry exists, create a virtual one with 0 stock
    const transformedProducts = products.map((product) => {
      let inventory = product.inventory;
      
      // If no inventory entry exists for this warehouse, create a virtual one with 0 stock
      if (!inventory || inventory.length === 0) {
        const warehouseId = query.warehouseId!; // Safe because we're in the warehouseId branch
        inventory = [{
          id: `temp-${product.id}-${warehouseId}`,
          productId: product.id,
          warehouseId: warehouseId,
          quantity: 0, // Use number instead of Decimal for JSON serialization
          minStockLevel: 0,
          maxStockLevel: null,
          lastRestockedAt: null,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          warehouse: warehouse || {
            id: warehouseId,
            name: 'Unknown',
            code: 'UNK',
            type: 'BOUTIQUE' as const,
          },
        }] as any; // Type assertion needed because we're using numbers instead of Decimal
      } else {
        // Convert Decimal to number for proper JSON serialization
        inventory = inventory.map((inv) => ({
          ...inv,
          quantity: Number(inv.quantity),
          minStockLevel: Number(inv.minStockLevel || 0),
        })) as any; // Type assertion needed because we're converting Decimal to number
      }

      return {
        ...product,
        categories: product.categories.map((pc) => pc.category),
        inventory,
      };
    });

    return createPaginatedResponse(transformedProducts, total, page, limit);
  }

  // No warehouseId - return all inventory entries
  const includeInventory = {
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

  // Transform to include flattened categories array and convert Decimal to number
  const transformedProducts = products.map((product) => ({
    ...product,
    categories: product.categories.map((pc) => pc.category),
    inventory: product.inventory.map((inv) => ({
      ...inv,
      quantity: Number(inv.quantity), // Convert Decimal to number for JSON serialization
      minStockLevel: Number(inv.minStockLevel || 0),
    })) as any, // Type assertion needed because we're converting Decimal to number
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

  // Get all active warehouses to ensure we show inventory for all warehouses
  const allWarehouses = await prisma.warehouse.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true, type: true },
  });

  console.log(`[getProductById] Product ${product.name} (${product.id}): Found ${allWarehouses.length} active warehouses`);
  console.log(`[getProductById] Product has ${product.inventory.length} existing inventory entries`);

  // Create a map of existing inventory entries by warehouseId
  const inventoryMap = new Map(
    product.inventory.map((inv) => [inv.warehouseId, inv])
  );

  // Ensure all warehouses have an inventory entry (virtual with 0 stock if missing)
  const completeInventory = allWarehouses.map((warehouse) => {
    const existingInv = inventoryMap.get(warehouse.id);
    if (existingInv) {
      const qty = Number(existingInv.quantity);
      console.log(`[getProductById] Warehouse ${warehouse.name} (${warehouse.type}): ${qty} units (raw: ${existingInv.quantity}, type: ${typeof existingInv.quantity})`);
      // Ensure quantity is properly serialized (convert Decimal to number for JSON)
      return {
        ...existingInv,
        quantity: qty, // Convert Decimal to number for proper JSON serialization
        minStockLevel: Number(existingInv.minStockLevel || 0),
      };
    }
    // Create virtual inventory entry with 0 stock
    console.log(`[getProductById] Warehouse ${warehouse.name} (${warehouse.type}): Creating virtual entry with 0 stock`);
    return {
      id: `temp-${product.id}-${warehouse.id}`,
      productId: product.id,
      warehouseId: warehouse.id,
      quantity: 0, // Use number instead of Decimal for JSON serialization
      minStockLevel: 0,
      maxStockLevel: null,
      lastRestockedAt: null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      warehouse: warehouse,
    };
  });

  console.log(`[getProductById] Returning ${completeInventory.length} inventory entries for product ${product.name}`);

  // Transform to flatten categories
  return {
    ...product,
    categories: product.categories.map((pc) => pc.category),
    inventory: completeInventory,
  };
}

export async function getProductByBarcode(barcode: string, warehouseId?: string) {
  const product = await prisma.product.findUnique({
    where: { barcode },
    include: {
      categories: {
        include: {
          category: { select: { id: true, name: true, parentId: true } },
        },
      },
      inventory: warehouseId
        ? {
            where: { warehouseId },
            include: {
              warehouse: { select: { id: true, name: true, code: true, type: true } },
            },
          }
        : {
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

export async function createProduct(input: CreateProductInput, employeeId?: string) {
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

  // Validate warehouse access if stock and warehouseId are provided
  if (warehouseId && stock !== undefined && employeeId) {
    await requireWarehouseAccess(employeeId, warehouseId);
  }

  // Create product globally (no warehouse context needed)
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

  // Create inventory record if warehouse and stock are provided
  // Only create if employee has access to the warehouse
  if (warehouseId && stock !== undefined && stock > 0) {
    // Access already validated above
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouseId,
        quantity: stock,
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

export async function updateProduct(id: string, input: UpdateProductInput, employeeId?: string) {
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

  // Validate warehouse access if stock and warehouseId are provided
  if (warehouseId && stock !== undefined && employeeId) {
    await requireWarehouseAccess(employeeId, warehouseId);
  }

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
    if (stock !== undefined && warehouseId) {
      // Access already validated above
      // Get current inventory to detect stock reduction
      const currentInventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: id,
            warehouseId: warehouseId,
          },
        },
      });

      const oldQuantity = currentInventory ? Number(currentInventory.quantity) : 0;
      const newQuantity = Number(stock);

      await tx.inventory.upsert({
        where: {
          productId_warehouseId: {
            productId: id,
            warehouseId: warehouseId,
          },
        },
        update: {
          quantity: stock,
          ...(minStockLevel !== undefined && { minStockLevel }),
        },
        create: {
          productId: id,
          warehouseId: warehouseId,
          quantity: stock,
          minStockLevel: minStockLevel ?? 1,
        },
      });

      // Create alert for stock reduction (only if quantity decreased)
      if (employeeId && newQuantity < oldQuantity) {
        // Get employee and warehouse info for alert
        const [employee, warehouse] = await Promise.all([
          tx.employee.findUnique({
            where: { id: employeeId },
            select: { fullName: true },
          }),
          tx.warehouse.findUnique({
            where: { id: warehouseId },
            select: { name: true },
          }),
        ]);

        if (employee && warehouse && updatedProduct) {
          // Create alert asynchronously (don't block the transaction)
          setImmediate(async () => {
            try {
              await createStockReductionAlert(
                id,
                updatedProduct.name,
                warehouseId,
                warehouse.name,
                oldQuantity,
                newQuantity,
                employee.fullName
              );
            } catch (error) {
              console.error('Failed to create stock reduction alert:', error);
            }
          });
        }
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

export async function deleteProduct(id: string, employeeRoleName: string, employeeId?: string) {
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

  // Get employee info for alert (before deletion)
  let employeeName = 'Admin';
  if (employeeId) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { fullName: true },
    });
    if (employee) {
      employeeName = employee.fullName;
    }
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

  // Create alert before deletion
  setImmediate(async () => {
    try {
      await createProductDeletionAlert(id, product.name, employeeName);
    } catch (error) {
      console.error('Failed to create product deletion alert:', error);
    }
  });

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

