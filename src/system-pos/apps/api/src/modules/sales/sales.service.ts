import prisma from '../../config/database.js';
import { ApiError, PaginationQuery } from '../../common/types/index.js';
import { getPaginationParams, createPaginatedResponse } from '../../common/utils/pagination.js';
import { generateInvoiceNumber } from '../../common/utils/invoice.js';
import { SALE_STATUS, STOCK_MOVEMENT_TYPES } from '../../config/constants.js';
import { CreateSaleInput, VoidSaleInput, RefundSaleInput } from './sales.schema.js';

interface SaleQuery extends PaginationQuery {
  shiftId?: string;
  employeeId?: string;
  customerId?: string;
  warehouseId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getSales(query: SaleQuery) {
  const { page, limit, skip } = getPaginationParams(query);

  const where: any = {};

  if (query.shiftId) where.shiftId = query.shiftId;
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.customerId) where.customerId = query.customerId;
  if (query.warehouseId) where.warehouseId = query.warehouseId;
  if (query.status) where.status = query.status;

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
    if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, fullName: true } },
        customer: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        payments: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.sale.count({ where }),
  ]);

  return createPaginatedResponse(sales, total, page, limit);
}

export async function getSaleById(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, fullName: true } },
      customer: { select: { id: true, name: true, phone: true, email: true } },
      warehouse: { select: { id: true, name: true, code: true } },
      shift: { select: { id: true, startTime: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      },
      payments: true,
    },
  });

  if (!sale) {
    throw ApiError.notFound('Sale not found');
  }

  return sale;
}

export async function getSaleByInvoice(invoiceNumber: string) {
  const sale = await prisma.sale.findUnique({
    where: { invoiceNumber },
    include: {
      employee: { select: { id: true, fullName: true } },
      customer: { select: { id: true, name: true, phone: true, email: true } },
      warehouse: { select: { id: true, name: true, code: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      },
      payments: true,
    },
  });

  if (!sale) {
    throw ApiError.notFound('Sale not found');
  }

  return sale;
}

export async function createSale(input: CreateSaleInput, employeeId: string) {
  // Get employee to find their warehouse
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { warehouse: true },
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  // Get warehouse from input or employee's assigned warehouse
  let warehouseId = input.warehouseId;
  let warehouse;
  
  if (!warehouseId) {
    if (employee.warehouseId) {
      warehouseId = employee.warehouseId;
    } else {
      // Get default warehouse
      const defaultWarehouse = await prisma.warehouse.findFirst({
        where: { isDefault: true, isActive: true },
      });
      if (!defaultWarehouse) {
        throw ApiError.badRequest('No warehouse available for this sale');
      }
      warehouseId = defaultWarehouse.id;
    }
  }

  // Verify warehouse exists and is a Boutique
  warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
  });

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found');
  }

  if (warehouse.type !== 'BOUTIQUE') {
    throw ApiError.badRequest('Sales can only be made from Boutique warehouses');
  }

  // Verify all products exist and get their details
  const productIds = input.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    throw ApiError.badRequest('One or more products not found');
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // CRITICAL: Check stock availability for the SPECIFIC warehouse
  // This ensures products and quantities are managed correctly per warehouse
  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw ApiError.badRequest(`Product not found for item: ${item.productId}`);
    }

    // Verify inventory exists for this specific warehouse
    const inventory = await prisma.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId: item.productId,
          warehouseId: warehouseId, // Use the warehouse from input/employee
        },
      },
    });

    if (!inventory) {
      throw ApiError.badRequest(
        `Product "${product.name}" (SKU: ${product.sku}) is not available in warehouse "${warehouse.name}" (${warehouse.code}). Please check inventory.`
      );
    }

    const availableQuantity = Number(inventory.quantity);
    const requestedQuantity = item.quantity;

    if (availableQuantity < requestedQuantity) {
      throw ApiError.badRequest(
        `Insufficient stock for "${product.name}" in warehouse "${warehouse.name}". Available: ${availableQuantity}, Requested: ${requestedQuantity}`
      );
    }
  }

  // Calculate totals
  let subtotal = 0;
  const saleItems = input.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const itemTotal = item.unitPrice * item.quantity - item.discountAmount;
    subtotal += itemTotal;

    return {
      productId: item.productId,
      productName: product.name,
      productSku: product.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount,
      total: itemTotal,
    };
  });

  // Apply sale discount
  let discountAmount = 0;
  if (input.discountType && input.discountValue) {
    if (input.discountType === 'percentage') {
      discountAmount = (subtotal * input.discountValue) / 100;
    } else {
      discountAmount = input.discountValue;
    }
  }

  // Handle loyalty points redemption
  let loyaltyPointsUsed = input.loyaltyPointsUsed || 0;
  let loyaltyDiscountAmount = 0;
  
  if (loyaltyPointsUsed > 0 && input.customerId) {
    // Get customer and loyalty settings
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
    });

    if (!customer) {
      throw ApiError.badRequest('Customer not found');
    }

    if (customer.loyaltyPoints < loyaltyPointsUsed) {
      throw ApiError.badRequest(`Insufficient loyalty points. Customer has ${customer.loyaltyPoints} points.`);
    }

    // Get conversion rate from SystemSettings (global settings, admin-only)
    const systemSettings = await prisma.systemSettings.findFirst();
    const conversionRate = systemSettings?.loyaltyPointsConversionRate 
      ? Number(systemSettings.loyaltyPointsConversionRate)
      : 1.0; // Default: 1 point = 1 FCFA

    // Calculate discount from points
    loyaltyDiscountAmount = loyaltyPointsUsed * conversionRate;
    
    // Ensure discount doesn't exceed subtotal
    if (loyaltyDiscountAmount > subtotal) {
      loyaltyDiscountAmount = subtotal;
      // Recalculate points used based on actual discount
      loyaltyPointsUsed = Math.floor(loyaltyDiscountAmount / conversionRate);
    }

    // Add loyalty discount to total discount
    discountAmount += loyaltyDiscountAmount;
  }

  // Calculate tax
  const taxRate = input.taxRate ?? Number(process.env.DEFAULT_TAX_RATE || 18);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  // Verify payment total
  const paymentTotal = input.payments.reduce((sum, p) => sum + p.amount, 0);
  if (paymentTotal < total) {
    throw ApiError.badRequest('Insufficient payment amount');
  }

  // Calculate change for cash payments
  const payments = input.payments.map((payment) => {
    const basePayment = {
      method: payment.method,
      amount: payment.amount,
      amountReceived: payment.amountReceived,
      reference: payment.reference,
    };
    
    if (payment.method === 'cash' && payment.amountReceived) {
      return {
        ...basePayment,
        changeGiven: payment.amountReceived - payment.amount,
      };
    }
    return basePayment;
  });

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Create sale in transaction
  const sale = await prisma.$transaction(async (tx) => {
    // Deduct loyalty points if used
    if (loyaltyPointsUsed > 0 && input.customerId) {
      await tx.customer.update({
        where: { id: input.customerId },
        data: { loyaltyPoints: { decrement: loyaltyPointsUsed } },
      });
    }

    // Create sale
    const newSale = await tx.sale.create({
      data: {
        invoiceNumber,
        employeeId,
        customerId: input.customerId,
        warehouseId: warehouseId,
        subtotal,
        discountType: input.discountType || null,
        discountValue: input.discountValue || null,
        discountAmount,
        loyaltyPointsUsed,
        taxRate,
        taxAmount,
        total,
        status: SALE_STATUS.COMPLETED,
        notes: input.notes,
        items: {
          create: saleItems,
        },
        payments: {
          create: payments,
        },
      },
      include: {
        items: true,
        payments: true,
        customer: { select: { id: true, name: true } },
      },
    });

    // Update inventory
    for (const item of input.items) {
      // Verify inventory entry exists before updating
      const inventoryEntry = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: warehouseId,
          },
        },
      });

      if (!inventoryEntry) {
        throw ApiError.badRequest(
          `Inventory entry not found for product ${productMap.get(item.productId)?.name} in warehouse ${warehouse.name}`
        );
      }

      // Update inventory quantity
      const updatedInventory = await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: warehouseId,
          },
        },
        data: {
          quantity: { decrement: item.quantity },
        },
      });

      // Verify the update was successful and quantity is not negative
      if (Number(updatedInventory.quantity) < 0) {
        throw ApiError.badRequest(
          `Stock would become negative for product ${productMap.get(item.productId)?.name}. Current stock: ${Number(inventoryEntry.quantity)}, Requested: ${item.quantity}`
        );
      }

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: warehouseId,
          type: STOCK_MOVEMENT_TYPES.OUT,
          quantity: -item.quantity,
          referenceType: 'sale',
          referenceId: newSale.id,
          createdBy: employeeId,
        },
      });
    }

    // Add loyalty points if customer exists and points were not used
    if (input.customerId && loyaltyPointsUsed === 0) {
      // Get attribution rate from SystemSettings (global settings, admin-only)
      const systemSettings = await tx.systemSettings.findFirst();
      const attributionRate = systemSettings?.loyaltyPointsAttributionRate
        ? Number(systemSettings.loyaltyPointsAttributionRate)
        : 0.01; // Default: 1% of total

      // Calculate points to award
      const pointsToAward = Math.floor(total * attributionRate);

      if (pointsToAward > 0) {
        await tx.customer.update({
          where: { id: input.customerId },
          data: { loyaltyPoints: { increment: pointsToAward } },
        });
      }
    }

    return newSale;
  });

  return sale;
}

export async function voidSale(id: string, input: VoidSaleInput, employeeId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!sale) {
    throw ApiError.notFound('Sale not found');
  }

  if (sale.status !== SALE_STATUS.COMPLETED) {
    throw ApiError.badRequest('Only completed sales can be voided');
  }

  // Void sale and restore inventory
  const updated = await prisma.$transaction(async (tx) => {
    // Update sale status
    const voidedSale = await tx.sale.update({
      where: { id },
      data: {
        status: SALE_STATUS.VOIDED,
        notes: `${sale.notes || ''}\nVoided by employee ${employeeId}: ${input.reason}`,
      },
    });

    // Restore inventory
    for (const item of sale.items) {
      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: sale.warehouseId,
          },
        },
        data: {
          quantity: { increment: Number(item.quantity) },
        },
      });

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: sale.warehouseId,
          type: STOCK_MOVEMENT_TYPES.IN,
          quantity: Number(item.quantity),
          referenceType: 'void',
          referenceId: sale.id,
          notes: `Void: ${input.reason}`,
          createdBy: employeeId,
        },
      });
    }

    // Create audit log
    await tx.auditLog.create({
      data: {
        employeeId,
        action: 'void',
        resource: 'sale',
        resourceId: id,
        newValue: { reason: input.reason },
      },
    });

    return voidedSale;
  });

  return updated;
}

export async function refundSale(id: string, input: RefundSaleInput, employeeId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: true, payments: true },
  });

  if (!sale) {
    throw ApiError.notFound('Sale not found');
  }

  if (sale.status !== SALE_STATUS.COMPLETED) {
    throw ApiError.badRequest('Only completed sales can be refunded');
  }

  // For now, implement full refund
  const updated = await prisma.$transaction(async (tx) => {
    // Update sale status
    const refundedSale = await tx.sale.update({
      where: { id },
      data: {
        status: SALE_STATUS.REFUNDED,
        notes: `${sale.notes || ''}\nRefunded by employee ${employeeId}: ${input.reason}`,
      },
    });

    // Restore inventory
    for (const item of sale.items) {
      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: sale.warehouseId,
          },
        },
        data: {
          quantity: { increment: Number(item.quantity) },
        },
      });

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: sale.warehouseId,
          type: STOCK_MOVEMENT_TYPES.IN,
          quantity: Number(item.quantity),
          referenceType: 'refund',
          referenceId: sale.id,
          notes: `Refund: ${input.reason}`,
          createdBy: employeeId,
        },
      });
    }

    // Update payment statuses
    await tx.payment.updateMany({
      where: { saleId: id },
      data: { status: 'refunded' },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        employeeId,
        action: 'refund',
        resource: 'sale',
        resourceId: id,
        newValue: { reason: input.reason },
      },
    });

    return refundedSale;
  });

  return updated;
}

