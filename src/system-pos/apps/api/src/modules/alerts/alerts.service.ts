import prisma from '../../config/database.js';
import { ApiError } from '../../common/types/index.js';
import { createPaginatedResponse, getPaginationParams, PaginationQuery } from '../../common/utils/pagination.js';

export type AlertType = 
  | 'stock_reduction' 
  | 'transfer_request' 
  | 'transfer_approval' 
  | 'transfer_rejection' 
  | 'transfer_reception' 
  | 'user_creation' 
  | 'product_deletion';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface CreateAlertInput {
  type: AlertType;
  severity?: AlertSeverity;
  title: string;
  message: string;
  warehouseId?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export interface AlertQuery extends PaginationQuery {
  warehouseId?: string;
  type?: AlertType;
  severity?: AlertSeverity;
  isRead?: boolean;
}

/**
 * Create a new manager alert
 */
export async function createAlert(input: CreateAlertInput) {
  const alert = await prisma.managerAlert.create({
    data: {
      type: input.type,
      severity: input.severity || 'warning',
      title: input.title,
      message: input.message,
      warehouseId: input.warehouseId,
      resourceId: input.resourceId,
      metadata: input.metadata || {},
    },
    include: {
      warehouse: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  return alert;
}

/**
 * Get alerts for managers assigned to specific warehouses
 */
export async function getAlerts(
  query: AlertQuery,
  employeeId: string,
  employeeRole: string
) {
  const { page, limit, skip } = getPaginationParams(query);

  const where: any = {};

  // Only admins can see alerts
  if (employeeRole !== 'admin') {
    return createPaginatedResponse([], 0, page, limit);
  }

  // Filter by warehouse if provided
  if (query.warehouseId) {
    where.warehouseId = query.warehouseId;
  }
  // Admins see all alerts (no filter if no warehouseId specified)

  // Filter by type if provided
  if (query.type) {
    where.type = query.type;
  }

  // Filter by severity if provided
  if (query.severity) {
    where.severity = query.severity;
  }

  // Filter by read status if provided
  if (query.isRead !== undefined) {
    where.isRead = query.isRead;
  }

  const [alerts, total] = await Promise.all([
    prisma.managerAlert.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    }),
    prisma.managerAlert.count({ where }),
  ]);

  return createPaginatedResponse(alerts, total, page, limit);
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string, employeeId: string) {
  const alert = await prisma.managerAlert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw ApiError.notFound('Alert not found');
  }

  const updated = await prisma.managerAlert.update({
    where: { id: alertId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return updated;
}

/**
 * Mark all alerts as read for an admin
 */
export async function markAllAlertsAsRead(employeeId: string, employeeRole: string) {
  // Only admins can mark alerts as read
  if (employeeRole !== 'admin') {
    return { count: 0 };
  }

  const where: any = { isRead: false };

  const result = await prisma.managerAlert.updateMany({
    where,
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return result;
}

/**
 * Get unread alerts count for admin
 */
export async function getUnreadAlertsCount(employeeId: string, employeeRole: string) {
  // Only admins can see alerts
  if (employeeRole !== 'admin') {
    return 0;
  }

  const where: any = { isRead: false };

  const count = await prisma.managerAlert.count({ where });
  return count;
}

