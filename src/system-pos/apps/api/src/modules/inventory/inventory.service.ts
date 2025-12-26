import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/database.js';
import { ApiError, PaginationQuery } from '../../common/types/index.js';
import { getPaginationParams, createPaginatedResponse } from '../../common/utils/pagination.js';
import { requireWarehouseAccess } from '../../common/middleware/auth.js';
import { STOCK_MOVEMENT_TYPES } from '../../config/constants.js';
import { AdjustStockInput, TransferStockInput, SetStockLevelsInput } from './inventory.schema.js';

interface InventoryQuery extends PaginationQuery {
  warehouseId?: string;
  productId?: string;
  lowStock?: string;
  search?: string;
}

export async function getInventory(query: InventoryQuery) {
  const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(query);

  // Build product filter
  const productWhere: any = {
    isActive: true, // Only show active products
  };

  // Search by product name or SKU
  if (query.search) {
    productWhere.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { sku: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.productId) {
    productWhere.id = query.productId;
  }

  // If warehouseId is specified, show all products with inventory for that warehouse (or 0 stock)
  if (query.warehouseId) {
    // Get warehouse info first
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: query.warehouseId },
      select: { id: true, name: true, code: true, type: true },
    });

    if (!warehouse) {
      throw ApiError.notFound('Warehouse not found');
    }

    // Get all products with their inventory for this warehouse
    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          inventory: {
            where: { warehouseId: query.warehouseId },
          },
        },
      }),
      prisma.product.count({ where: productWhere }),
    ]);

    // Transform to inventory items - create entry for each product (even if no inventory record)
    const inventoryItems = products.map((product) => {
      const inventoryEntry = product.inventory[0]; // Should be 0 or 1 entry for this warehouse
      
      return {
        id: inventoryEntry?.id || `temp-${product.id}-${query.warehouseId}`,
        productId: product.id,
        warehouseId: query.warehouseId,
        quantity: inventoryEntry?.quantity || new Decimal(0),
        minStockLevel: inventoryEntry?.minStockLevel || new Decimal(0),
        maxStockLevel: inventoryEntry?.maxStockLevel || null,
        lastRestockedAt: inventoryEntry?.lastRestockedAt || null,
        createdAt: inventoryEntry?.createdAt || product.createdAt,
        updatedAt: inventoryEntry?.updatedAt || product.updatedAt,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          unit: product.unit,
        },
        warehouse: warehouse,
      };
    });

    // Filter for low stock if requested
    let filteredInventory = inventoryItems;
    if (query.lowStock === 'true') {
      filteredInventory = inventoryItems.filter(
        (item) => Number(item.quantity) <= Number(item.minStockLevel)
      );
    }

    return createPaginatedResponse(filteredInventory, totalProducts, page, limit);
  }

  // No warehouseId specified - show all inventory entries (existing behavior)
  const where: any = {};

  if (query.productId) {
    where.productId = query.productId;
  }

  // Search by product name or SKU
  if (query.search) {
    where.product = {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
      ],
    };
  }

  // Get all inventory entries
  const [allInventory, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        warehouse: { select: { id: true, name: true, code: true, type: true } },
      },
    }),
    prisma.inventory.count({ where }),
  ]);

  // Filter for low stock if requested
  let inventory = allInventory;
  if (query.lowStock === 'true') {
    inventory = allInventory.filter((item) => Number(item.quantity) <= Number(item.minStockLevel));
  }

  return createPaginatedResponse(inventory, total, page, limit);
}

export async function getLowStock(warehouseId?: string) {
  const where: any = {};

  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  // Get all inventory and filter for low stock
  const allInventory = await prisma.inventory.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, sku: true, unit: true } },
      warehouse: { select: { id: true, name: true, code: true } },
    },
  });

  // Filter for items where quantity <= minStockLevel
  const lowStockItems = allInventory
    .filter(item => Number(item.quantity) <= Number(item.minStockLevel))
    .sort((a, b) => {
      // Sort by ratio of quantity to minStockLevel (lowest ratio first)
      const ratioA = Number(a.minStockLevel) > 0 ? Number(a.quantity) / Number(a.minStockLevel) : 0;
      const ratioB = Number(b.minStockLevel) > 0 ? Number(b.quantity) / Number(b.minStockLevel) : 0;
      return ratioA - ratioB;
    });

  return lowStockItems;
}

export async function getStockMovements(query: InventoryQuery & { type?: string }) {
  const { page, limit, skip } = getPaginationParams(query);

  const where: any = {};

  if (query.warehouseId) {
    where.warehouseId = query.warehouseId;
  }

  if (query.productId) {
    where.productId = query.productId;
  }

  if (query.type) {
    where.type = query.type;
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        employee: { select: { id: true, fullName: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return createPaginatedResponse(movements, total, page, limit);
}

export async function adjustStock(input: AdjustStockInput, employeeId: string) {
  // Validate warehouse access
  await requireWarehouseAccess(employeeId, input.warehouseId);

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Verify warehouse exists
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: input.warehouseId },
  });

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found');
  }

  // Get or create inventory record
  let inventory = await prisma.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId: input.productId,
        warehouseId: input.warehouseId,
      },
    },
  });

  const currentQty = inventory ? Number(inventory.quantity) : 0;
  const newQty = currentQty + input.quantity;

  if (newQty < 0) {
    throw ApiError.badRequest('Insufficient stock');
  }

  // Update or create inventory
  if (inventory) {
    inventory = await prisma.inventory.update({
      where: { id: inventory.id },
      data: { quantity: newQty },
    });
  } else {
    inventory = await prisma.inventory.create({
      data: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantity: newQty,
      },
    });
  }

  // Create stock movement record
  await prisma.stockMovement.create({
    data: {
      productId: input.productId,
      warehouseId: input.warehouseId,
      type: STOCK_MOVEMENT_TYPES.ADJUSTMENT,
      quantity: input.quantity,
      referenceType: 'adjustment',
      notes: input.reason || input.notes,
      createdBy: employeeId,
    },
  });

  return inventory;
}

export async function transferStock(input: TransferStockInput, employeeId: string) {
  if (input.fromWarehouseId === input.toWarehouseId) {
    throw ApiError.badRequest('Source and destination warehouses must be different');
  }

  // Validate warehouse access - employee must have access to source warehouse
  // (destination warehouse access is optional, as transfers can be requested)
  await requireWarehouseAccess(employeeId, input.fromWarehouseId);

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Check source inventory
  const sourceInventory = await prisma.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId: input.productId,
        warehouseId: input.fromWarehouseId,
      },
    },
  });

  if (!sourceInventory || Number(sourceInventory.quantity) < input.quantity) {
    throw ApiError.badRequest('Insufficient stock in source warehouse');
  }

  // Perform transfer in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Decrease source
    await tx.inventory.update({
      where: { id: sourceInventory.id },
      data: { quantity: { decrement: input.quantity } },
    });

    // Increase destination (create if not exists)
    const destInventory = await tx.inventory.upsert({
      where: {
        productId_warehouseId: {
          productId: input.productId,
          warehouseId: input.toWarehouseId,
        },
      },
      update: { quantity: { increment: input.quantity } },
      create: {
        productId: input.productId,
        warehouseId: input.toWarehouseId,
        quantity: input.quantity,
      },
    });

    // Create movement records
    await tx.stockMovement.createMany({
      data: [
        {
          productId: input.productId,
          warehouseId: input.fromWarehouseId,
          type: STOCK_MOVEMENT_TYPES.TRANSFER,
          quantity: -input.quantity,
          referenceType: 'transfer',
          notes: `Transfer to warehouse: ${input.toWarehouseId}. ${input.notes || ''}`,
          createdBy: employeeId,
        },
        {
          productId: input.productId,
          warehouseId: input.toWarehouseId,
          type: STOCK_MOVEMENT_TYPES.TRANSFER,
          quantity: input.quantity,
          referenceType: 'transfer',
          notes: `Transfer from warehouse: ${input.fromWarehouseId}. ${input.notes || ''}`,
          createdBy: employeeId,
        },
      ],
    });

    return destInventory;
  });

  return result;
}

export async function setStockLevels(input: SetStockLevelsInput) {
  const inventory = await prisma.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId: input.productId,
        warehouseId: input.warehouseId,
      },
    },
  });

  if (!inventory) {
    throw ApiError.notFound('Inventory record not found');
  }

  const updated = await prisma.inventory.update({
    where: { id: inventory.id },
    data: {
      minStockLevel: input.minStockLevel,
      maxStockLevel: input.maxStockLevel,
    },
  });

  return updated;
}

