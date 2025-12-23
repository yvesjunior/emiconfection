import prisma from '../../config/database.js';

/**
 * Generate invoice number in format: INV-YYYYMMDD-XXXX
 * Where XXXX is a daily sequential number
 */
export async function generateInvoiceNumber(): Promise<string> {
  const prefix = process.env.INVOICE_PREFIX || 'INV';
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the last invoice of today
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const lastSale = await prisma.sale.findFirst({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  });

  let sequence = 1;
  
  if (lastSale) {
    // Extract sequence from last invoice number
    const lastSequence = lastSale.invoiceNumber.split('-').pop();
    if (lastSequence) {
      sequence = parseInt(lastSequence, 10) + 1;
    }
  }

  const sequenceStr = sequence.toString().padStart(4, '0');
  return `${prefix}-${dateStr}-${sequenceStr}`;
}

/**
 * Generate PO number in format: PO-YYYYMMDD-XXXX
 */
export async function generatePONumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const lastPO = await prisma.purchaseOrder.findFirst({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: {
      poNumber: 'desc',
    },
    select: {
      poNumber: true,
    },
  });

  let sequence = 1;
  
  if (lastPO) {
    const lastSequence = lastPO.poNumber.split('-').pop();
    if (lastSequence) {
      sequence = parseInt(lastSequence, 10) + 1;
    }
  }

  const sequenceStr = sequence.toString().padStart(4, '0');
  return `PO-${dateStr}-${sequenceStr}`;
}

