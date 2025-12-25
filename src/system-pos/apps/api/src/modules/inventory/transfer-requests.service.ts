import prisma from '../../config/database.js';
import { ApiError, PaginationQuery } from '../../common/types/index.js';
import { getPaginationParams, createPaginatedResponse } from '../../common/utils/pagination.js';
import { CreateTransferRequestInput, ApproveTransferRequestInput } from './transfer-requests.schema.js';
import { transferStock } from './inventory.service.js';
import { TransferStockInput } from './inventory.schema.js';

interface TransferRequestQuery extends PaginationQuery {
  status?: string;
  warehouseId?: string;
  productId?: string;
}

export async function getTransferRequests(query: TransferRequestQuery, employeeId: string, employeeRole: string) {
  const { page, limit, skip } = getPaginationParams(query);

  const where: any = {};

  if (query.status) where.status = query.status;
  if (query.productId) where.productId = query.productId;
  if (query.warehouseId) {
    // For managers, show requests for their assigned warehouses (source)
    if (employeeRole === 'manager') {
      where.fromWarehouseId = query.warehouseId;
    } else {
      where.OR = [
        { fromWarehouseId: query.warehouseId },
        { toWarehouseId: query.warehouseId },
      ];
    }
  } else if (employeeRole === 'manager') {
    // Manager sees only requests for their assigned warehouses
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { warehouse: true },
    });

    if (employee?.warehouseId) {
      where.fromWarehouseId = employee.warehouseId;
    } else {
      // Manager with no warehouse assignment sees nothing
      return createPaginatedResponse([], 0, page, limit);
    }
  } else if (employeeRole === 'cashier') {
    // Seller sees only their own requests
    where.requestedBy = employeeId;
  }
  // Admin sees all (no filter)

  const [requests, total] = await Promise.all([
    prisma.stockTransferRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        fromWarehouse: { select: { id: true, name: true, code: true, type: true } },
        toWarehouse: { select: { id: true, name: true, code: true, type: true } },
        requester: { select: { id: true, fullName: true } },
        approver: { select: { id: true, fullName: true } },
      },
    }),
    prisma.stockTransferRequest.count({ where }),
  ]);

  return createPaginatedResponse(requests, total, page, limit);
}

export async function getTransferRequestById(id: string) {
  const request = await prisma.stockTransferRequest.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      fromWarehouse: { select: { id: true, name: true, code: true, type: true } },
      toWarehouse: { select: { id: true, name: true, code: true, type: true } },
      requester: { select: { id: true, fullName: true } },
      approver: { select: { id: true, fullName: true } },
    },
  });

  if (!request) {
    throw ApiError.notFound('Transfer request not found');
  }

  return request;
}

export async function createTransferRequest(input: CreateTransferRequestInput, employeeId: string) {
  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Verify warehouses exist
  const [fromWarehouse, toWarehouse] = await Promise.all([
    prisma.warehouse.findUnique({ where: { id: input.fromWarehouseId } }),
    prisma.warehouse.findUnique({ where: { id: input.toWarehouseId } }),
  ]);

  if (!fromWarehouse || !toWarehouse) {
    throw ApiError.notFound('Warehouse not found');
  }

  if (fromWarehouse.id === toWarehouse.id) {
    throw ApiError.badRequest('Source and destination warehouses must be different');
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

  // Create transfer request
  const request = await prisma.stockTransferRequest.create({
    data: {
      productId: input.productId,
      fromWarehouseId: input.fromWarehouseId,
      toWarehouseId: input.toWarehouseId,
      quantity: input.quantity,
      requestedBy: employeeId,
      notes: input.notes,
      status: 'pending',
    },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      fromWarehouse: { select: { id: true, name: true, code: true } },
      toWarehouse: { select: { id: true, name: true, code: true } },
      requester: { select: { id: true, fullName: true } },
    },
  });

  return request;
}

export async function approveTransferRequest(
  id: string,
  input: ApproveTransferRequestInput,
  employeeId: string,
  employeeRole: string
) {
  const request = await prisma.stockTransferRequest.findUnique({
    where: { id },
    include: {
      product: true,
      fromWarehouse: true,
      toWarehouse: true,
    },
  });

  if (!request) {
    throw ApiError.notFound('Transfer request not found');
  }

  if (request.status !== 'pending') {
    throw ApiError.badRequest(`Transfer request is already ${request.status}`);
  }

  // Verify permissions
  if (employeeRole === 'manager') {
    // Manager must be assigned to the source warehouse
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { warehouse: true },
    });

    if (!employee || employee.warehouseId !== request.fromWarehouseId) {
      throw ApiError.forbidden('You can only approve transfer requests from your assigned warehouse');
    }
  } else if (employeeRole !== 'admin') {
    throw ApiError.forbidden('Only managers and administrators can approve transfer requests');
  }

  // If approved, perform the transfer
  if (input.status === 'approved') {
    // Verify stock is still available
    const sourceInventory = await prisma.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId: request.productId,
          warehouseId: request.fromWarehouseId,
        },
      },
    });

    if (!sourceInventory || Number(sourceInventory.quantity) < Number(request.quantity)) {
      throw ApiError.badRequest('Insufficient stock in source warehouse');
    }

    // Perform transfer
    const transferInput: TransferStockInput = {
      productId: request.productId,
      fromWarehouseId: request.fromWarehouseId,
      toWarehouseId: request.toWarehouseId,
      quantity: Number(request.quantity),
      notes: `Approved transfer request ${id}. ${input.notes || ''}`,
    };

    await transferStock(transferInput, employeeId);
  }

  // Update request status
  const updated = await prisma.stockTransferRequest.update({
    where: { id },
    data: {
      status: input.status,
      approvedBy: employeeId,
      notes: input.notes || request.notes,
    },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      fromWarehouse: { select: { id: true, name: true, code: true } },
      toWarehouse: { select: { id: true, name: true, code: true } },
      requester: { select: { id: true, fullName: true } },
      approver: { select: { id: true, fullName: true } },
    },
  });

  return updated;
}

