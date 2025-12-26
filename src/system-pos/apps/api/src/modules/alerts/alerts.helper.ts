import * as alertsService from './alerts.service.js';
import { AlertType, AlertSeverity } from './alerts.service.js';

/**
 * Create alert for stock reduction in manage mode (not from sales)
 */
export async function createStockReductionAlert(
  productId: string,
  productName: string,
  warehouseId: string,
  warehouseName: string,
  oldQuantity: number,
  newQuantity: number,
  employeeName: string
) {
  const reduction = oldQuantity - newQuantity;
  if (reduction <= 0) return; // Only alert on reduction, not increase

  await alertsService.createAlert({
    type: 'stock_reduction',
    severity: 'warning',
    title: 'Réduction de stock en mode gestion',
    message: `${employeeName} a réduit le stock de "${productName}" dans ${warehouseName} de ${oldQuantity} à ${newQuantity} (réduction de ${reduction} unités)`,
    warehouseId,
    resourceId: productId,
    metadata: {
      productName,
      warehouseName,
      oldQuantity,
      newQuantity,
      reduction,
      employeeName,
    },
  });
}

/**
 * Create alert for transfer request
 */
export async function createTransferRequestAlert(
  transferRequestId: string,
  productName: string,
  fromWarehouseName: string,
  toWarehouseName: string,
  requesterName: string
) {
  await alertsService.createAlert({
    type: 'transfer_request',
    severity: 'info',
    title: 'Nouvelle demande de transfert',
    message: `${requesterName} a demandé un transfert de "${productName}" de ${fromWarehouseName} vers ${toWarehouseName}`,
    resourceId: transferRequestId,
    metadata: {
      productName,
      fromWarehouseName,
      toWarehouseName,
      requesterName,
    },
  });
}

/**
 * Create alert for transfer approval
 */
export async function createTransferApprovalAlert(
  transferRequestId: string,
  productName: string,
  quantity: number,
  fromWarehouseName: string,
  toWarehouseName: string,
  approverName: string
) {
  await alertsService.createAlert({
    type: 'transfer_approval',
    severity: 'info',
    title: 'Transfert approuvé',
    message: `${approverName} a approuvé le transfert de ${quantity} unité(s) de "${productName}" de ${fromWarehouseName} vers ${toWarehouseName}`,
    resourceId: transferRequestId,
    metadata: {
      productName,
      quantity,
      fromWarehouseName,
      toWarehouseName,
      approverName,
    },
  });
}

/**
 * Create alert for transfer rejection
 */
export async function createTransferRejectionAlert(
  transferRequestId: string,
  productName: string,
  fromWarehouseName: string,
  toWarehouseName: string,
  rejectorName: string,
  reason?: string
) {
  await alertsService.createAlert({
    type: 'transfer_rejection',
    severity: 'warning',
    title: 'Transfert rejeté',
    message: `${rejectorName} a rejeté le transfert de "${productName}" de ${fromWarehouseName} vers ${toWarehouseName}${reason ? `: ${reason}` : ''}`,
    resourceId: transferRequestId,
    metadata: {
      productName,
      fromWarehouseName,
      toWarehouseName,
      rejectorName,
      reason,
    },
  });
}

/**
 * Create alert for transfer reception
 */
export async function createTransferReceptionAlert(
  transferRequestId: string,
  productName: string,
  quantity: number,
  fromWarehouseName: string,
  toWarehouseName: string,
  receiverName: string
) {
  await alertsService.createAlert({
    type: 'transfer_reception',
    severity: 'info',
    title: 'Transfert reçu',
    message: `${receiverName} a marqué comme reçu le transfert de ${quantity} unité(s) de "${productName}" de ${fromWarehouseName} vers ${toWarehouseName}`,
    resourceId: transferRequestId,
    metadata: {
      productName,
      quantity,
      fromWarehouseName,
      toWarehouseName,
      receiverName,
    },
  });
}

/**
 * Create alert for user creation
 */
export async function createUserCreationAlert(
  employeeId: string,
  employeeName: string,
  roleName: string,
  creatorName: string
) {
  await alertsService.createAlert({
    type: 'user_creation',
    severity: 'info',
    title: 'Nouvel utilisateur créé',
    message: `${creatorName} a créé un nouvel utilisateur: ${employeeName} (${roleName})`,
    resourceId: employeeId,
    metadata: {
      employeeName,
      roleName,
      creatorName,
    },
  });
}

/**
 * Create alert for product deletion
 */
export async function createProductDeletionAlert(
  productId: string,
  productName: string,
  deleterName: string
) {
  await alertsService.createAlert({
    type: 'product_deletion',
    severity: 'critical',
    title: 'Produit supprimé',
    message: `${deleterName} a supprimé le produit "${productName}"`,
    resourceId: productId,
    metadata: {
      productName,
      deleterName,
    },
  });
}

