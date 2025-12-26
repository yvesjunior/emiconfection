import prisma from '../../config/database.js';
import { ApiError, PaginationQuery } from '../../common/types/index.js';
import { getPaginationParams, createPaginatedResponse } from '../../common/utils/pagination.js';
import { CreateTransferRequestInput, ApproveTransferRequestInput } from './transfer-requests.schema.js';
import { transferStock } from './inventory.service.js';
import { TransferStockInput } from './inventory.schema.js';
import {
  createTransferRequestAlert,
  createTransferApprovalAlert,
  createTransferRejectionAlert,
  createTransferReceptionAlert,
} from '../alerts/alerts.helper.js';

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
    // For managers, verify they have access to the filtered warehouse
    if (employeeRole === 'manager') {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          warehouses: {
            select: { warehouseId: true },
          },
        },
      });

      if (employee) {
        const assignedWarehouseIds = employee.warehouses.map((ew) => ew.warehouseId);
        if (employee.warehouseId) {
          assignedWarehouseIds.push(employee.warehouseId);
        }
        const uniqueWarehouseIds = [...new Set(assignedWarehouseIds)];
        
        // Verify the filtered warehouse is in the manager's assigned warehouses
        if (!uniqueWarehouseIds.includes(query.warehouseId)) {
          // Manager doesn't have access to this warehouse, return empty
          return createPaginatedResponse([], 0, page, limit);
        }
      } else {
        // Employee not found, return empty
        return createPaginatedResponse([], 0, page, limit);
      }
    }
    
    // Apply warehouse filter (for both admin and manager)
    where.OR = [
      { fromWarehouseId: query.warehouseId },
      { toWarehouseId: query.warehouseId },
    ];
  } else if (employeeRole === 'manager') {
    // Manager sees requests for warehouses they are assigned to (source OR destination)
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        warehouses: {
          select: { warehouseId: true },
        },
      },
    });

    if (employee && employee.warehouses.length > 0) {
      const assignedWarehouseIds = employee.warehouses.map((ew) => ew.warehouseId);
      // Also include primary warehouseId for backward compatibility
      if (employee.warehouseId) {
        assignedWarehouseIds.push(employee.warehouseId);
      }
      const uniqueWarehouseIds = [...new Set(assignedWarehouseIds)];
      
      where.OR = [
        { fromWarehouseId: { in: uniqueWarehouseIds } },
        { toWarehouseId: { in: uniqueWarehouseIds } },
      ];
    } else if (employee?.warehouseId) {
      // Fallback to primary warehouseId
      where.OR = [
        { fromWarehouseId: employee.warehouseId },
        { toWarehouseId: employee.warehouseId },
      ];
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

  // Check that source warehouse has some stock (but don't require specific quantity)
  const sourceInventory = await prisma.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId: input.productId,
        warehouseId: input.fromWarehouseId,
      },
    },
  });

  if (!sourceInventory || Number(sourceInventory.quantity) <= 0) {
    throw ApiError.badRequest('No stock available in source warehouse');
  }

  // Create transfer request without quantity (quantity will be set during approval)
  const request = await prisma.stockTransferRequest.create({
    data: {
      productId: input.productId,
      fromWarehouseId: input.fromWarehouseId,
      toWarehouseId: input.toWarehouseId,
      quantity: null, // Will be set during approval
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

  // Create alert for transfer request
  setImmediate(async () => {
    try {
      await createTransferRequestAlert(
        request.id,
        request.product.name,
        request.fromWarehouse.name,
        request.toWarehouse.name,
        request.requester.fullName
      );
    } catch (error) {
      console.error('Failed to create transfer request alert:', error);
    }
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
    // Manager must be assigned to either the source OR destination warehouse
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        warehouses: {
          select: { warehouseId: true },
        },
      },
    });

    if (!employee) {
      throw ApiError.forbidden('Employee not found');
    }

    // Check if manager has access to destination warehouse (preferred) or source warehouse
    const hasDestinationAccess = employee.warehouses.some(
      (ew) => ew.warehouseId === request.toWarehouseId
    );
    const hasSourceAccess = employee.warehouses.some(
      (ew) => ew.warehouseId === request.fromWarehouseId
    );
    
    // Also check primary warehouseId for backward compatibility
    const hasPrimaryDestinationAccess = employee.warehouseId === request.toWarehouseId;
    const hasPrimarySourceAccess = employee.warehouseId === request.fromWarehouseId;

    if (!hasDestinationAccess && !hasSourceAccess && !hasPrimaryDestinationAccess && !hasPrimarySourceAccess) {
      throw ApiError.forbidden('You can only approve transfer requests for warehouses you are assigned to');
    }
  } else if (employeeRole !== 'admin') {
    throw ApiError.forbidden('Only managers and administrators can approve transfer requests');
  }

  // If approved, set the quantity and update status - don't transfer stock yet
  // Stock will be transferred when the receiving warehouse marks it as received
  if (input.status === 'approved') {
    // Quantity is required when approving
    if (!input.quantity || input.quantity <= 0) {
      throw ApiError.badRequest('Quantity is required when approving a transfer request');
    }

    // Verify stock is still available
    const sourceInventory = await prisma.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId: request.productId,
          warehouseId: request.fromWarehouseId,
        },
      },
    });

    if (!sourceInventory || Number(sourceInventory.quantity) < input.quantity) {
      throw ApiError.badRequest(`Insufficient stock in source warehouse. Available: ${Number(sourceInventory.quantity)}, Requested: ${input.quantity}`);
    }

    // Update request with approved quantity
    // Don't transfer stock here - stock will be transferred when receiving warehouse marks as received
  }

  // Get approver info for alert
  const approver = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { fullName: true },
  });

  // Update request status and quantity (if approved)
  const updated = await prisma.stockTransferRequest.update({
    where: { id },
    data: {
      status: input.status,
      approvedBy: employeeId,
      quantity: input.status === 'approved' && input.quantity ? input.quantity : request.quantity,
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

  // Create alert based on status
  setImmediate(async () => {
    try {
      if (input.status === 'approved' && approver && input.quantity) {
        await createTransferApprovalAlert(
          updated.id,
          updated.product.name,
          input.quantity,
          updated.fromWarehouse.name,
          updated.toWarehouse.name,
          approver.fullName
        );
      } else if (input.status === 'rejected' && approver) {
        await createTransferRejectionAlert(
          updated.id,
          updated.product.name,
          updated.fromWarehouse.name,
          updated.toWarehouse.name,
          approver.fullName,
          input.notes || undefined
        );
      }
    } catch (error) {
      console.error('Failed to create transfer approval/rejection alert:', error);
    }
  });

  return updated;
}

/**
 * Mark a transfer request as received and perform the actual stock transfer
 * Only managers/admins of the receiving warehouse can mark as received
 */
export async function markTransferRequestAsReceived(
  id: string,
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

  if (request.status !== 'approved') {
    throw ApiError.badRequest(`Transfer request must be approved before marking as received. Current status: ${request.status}`);
  }

  // Verify permissions - only managers/admins of the receiving warehouse can mark as received
  if (employeeRole === 'manager') {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        warehouses: {
          select: { warehouseId: true },
        },
      },
    });

    if (!employee) {
      throw ApiError.forbidden('Employee not found');
    }

    // Manager must be assigned to the receiving warehouse (toWarehouseId)
    const hasReceivingWarehouseAccess = employee.warehouses.some(
      (ew) => ew.warehouseId === request.toWarehouseId
    );
    const hasPrimaryReceivingWarehouseAccess = employee.warehouseId === request.toWarehouseId;

    if (!hasReceivingWarehouseAccess && !hasPrimaryReceivingWarehouseAccess) {
      throw ApiError.forbidden('You can only mark transfer requests as received for your assigned receiving warehouse');
    }
  } else if (employeeRole !== 'admin') {
    throw ApiError.forbidden('Only managers and administrators can mark transfer requests as received');
  }

  // Verify stock is still available in source warehouse
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

  // Perform the actual transfer
  const transferInput: TransferStockInput = {
    productId: request.productId,
    fromWarehouseId: request.fromWarehouseId,
    toWarehouseId: request.toWarehouseId,
    quantity: Number(request.quantity),
    notes: `Transfer completed - marked as received by ${employeeId}`,
  };

  await transferStock(transferInput, employeeId);

  // Get receiver info for alert
  const receiver = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { fullName: true },
  });

  // Update request status to completed
  const updated = await prisma.stockTransferRequest.update({
    where: { id },
    data: {
      status: 'completed',
    },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      fromWarehouse: { select: { id: true, name: true, code: true } },
      toWarehouse: { select: { id: true, name: true, code: true } },
      requester: { select: { id: true, fullName: true } },
      approver: { select: { id: true, fullName: true } },
    },
  });

  // Create alert for transfer reception
  if (receiver && updated.quantity) {
    setImmediate(async () => {
      try {
        await createTransferReceptionAlert(
          updated.id,
          updated.product.name,
          Number(updated.quantity),
          updated.fromWarehouse.name,
          updated.toWarehouse.name,
          receiver.fullName
        );
      } catch (error) {
        console.error('Failed to create transfer reception alert:', error);
      }
    });
  }

  return updated;
}

