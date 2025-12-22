import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatCurrency } from './utils';

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ReceiptPayment {
  method: string;
  amount: number;
  amountReceived?: number;
  changeGiven?: number;
}

interface ReceiptData {
  invoiceNumber: string;
  date: Date;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  payments: ReceiptPayment[];
  customer?: { name: string; phone?: string } | null;
  employee?: { name: string } | null;
  warehouse?: { name: string; address?: string; phone?: string } | null;
}

const getPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case 'cash': return 'Espèces';
    case 'card': return 'Carte bancaire';
    case 'mobile_money': return 'Mobile Money';
    case 'credit': return 'Crédit';
    default: return method;
  }
};

const formatDateTime = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateReceiptHTML = (data: ReceiptData): string => {
  const itemsHTML = data.items.map(item => `
    <tr>
      <td class="item-name">${item.name}</td>
      <td class="item-qty">${item.quantity}</td>
      <td class="item-price">${formatCurrency(item.unitPrice)}</td>
      <td class="item-total">${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  const paymentsHTML = data.payments.map(payment => {
    let paymentDetails = `
      <div class="payment-row">
        <span>${getPaymentMethodLabel(payment.method)}</span>
        <span>${formatCurrency(payment.amount)}</span>
      </div>
    `;
    
    if (payment.method === 'cash' && payment.amountReceived) {
      paymentDetails += `
        <div class="payment-row small">
          <span>Reçu</span>
          <span>${formatCurrency(payment.amountReceived)}</span>
        </div>
      `;
      if (payment.changeGiven && payment.changeGiven > 0) {
        paymentDetails += `
          <div class="payment-row small">
            <span>Monnaie</span>
            <span>${formatCurrency(payment.changeGiven)}</span>
          </div>
        `;
      }
    }
    
    return paymentDetails;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reçu ${data.invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          padding: 10px;
          max-width: 300px;
          margin: 0 auto;
          background: #fff;
        }
        
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        
        .store-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .store-info {
          font-size: 10px;
          color: #666;
        }
        
        .invoice-info {
          text-align: center;
          margin-bottom: 15px;
        }
        
        .invoice-number {
          font-size: 14px;
          font-weight: bold;
        }
        
        .date {
          font-size: 10px;
          color: #666;
        }
        
        .customer-info {
          border: 1px solid #ddd;
          padding: 8px;
          margin-bottom: 10px;
          border-radius: 4px;
          background: #f9f9f9;
        }
        
        .customer-info .label {
          font-size: 10px;
          color: #666;
        }
        
        .customer-info .name {
          font-weight: bold;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        
        th {
          text-align: left;
          border-bottom: 1px solid #000;
          padding: 5px 0;
          font-size: 10px;
        }
        
        td {
          padding: 5px 0;
          border-bottom: 1px dotted #ccc;
          font-size: 11px;
        }
        
        .item-name {
          width: 40%;
        }
        
        .item-qty {
          width: 15%;
          text-align: center;
        }
        
        .item-price, .item-total {
          width: 22%;
          text-align: right;
        }
        
        .totals {
          border-top: 1px dashed #000;
          padding-top: 10px;
          margin-bottom: 10px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        
        .total-row.discount {
          color: #27ae60;
        }
        
        .total-row.grand-total {
          font-size: 16px;
          font-weight: bold;
          border-top: 2px solid #000;
          padding-top: 8px;
          margin-top: 8px;
        }
        
        .payments {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        
        .payments-title {
          font-weight: bold;
          margin-bottom: 8px;
          font-size: 11px;
        }
        
        .payment-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        
        .payment-row.small {
          font-size: 10px;
          color: #666;
          padding-left: 10px;
        }
        
        .footer {
          text-align: center;
          border-top: 1px dashed #000;
          padding-top: 15px;
          margin-top: 15px;
        }
        
        .thank-you {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .footer-note {
          font-size: 9px;
          color: #666;
        }
        
        .served-by {
          font-size: 10px;
          color: #666;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-name">${data.warehouse?.name || 'POS System'}</div>
        ${data.warehouse?.address ? `<div class="store-info">${data.warehouse.address}</div>` : ''}
        ${data.warehouse?.phone ? `<div class="store-info">Tél: ${data.warehouse.phone}</div>` : ''}
      </div>
      
      <div class="invoice-info">
        <div class="invoice-number">${data.invoiceNumber}</div>
        <div class="date">${formatDateTime(data.date)}</div>
      </div>
      
      ${data.customer ? `
        <div class="customer-info">
          <div class="label">Client</div>
          <div class="name">${data.customer.name}</div>
          ${data.customer.phone ? `<div class="store-info">${data.customer.phone}</div>` : ''}
        </div>
      ` : ''}
      
      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th style="text-align: center">Qté</th>
            <th style="text-align: right">P.U.</th>
            <th style="text-align: right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-row">
          <span>Sous-total</span>
          <span>${formatCurrency(data.subtotal)}</span>
        </div>
        ${data.discountAmount > 0 ? `
          <div class="total-row discount">
            <span>Remise</span>
            <span>-${formatCurrency(data.discountAmount)}</span>
          </div>
        ` : ''}
        ${data.taxAmount > 0 ? `
          <div class="total-row">
            <span>TVA</span>
            <span>${formatCurrency(data.taxAmount)}</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>TOTAL</span>
          <span>${formatCurrency(data.total)}</span>
        </div>
      </div>
      
      <div class="payments">
        <div class="payments-title">PAIEMENT</div>
        ${paymentsHTML}
      </div>
      
      <div class="footer">
        <div class="thank-you">Merci de votre visite!</div>
        <div class="footer-note">Conservez ce reçu pour tout échange ou remboursement</div>
        ${data.employee ? `<div class="served-by">Servi par: ${data.employee.name}</div>` : ''}
      </div>
    </body>
    </html>
  `;
};

export const printReceipt = async (data: ReceiptData): Promise<void> => {
  const html = generateReceiptHTML(data);
  await Print.printAsync({ html });
};

export const shareReceipt = async (data: ReceiptData): Promise<void> => {
  const html = generateReceiptHTML(data);
  
  // Generate PDF
  const { uri } = await Print.printToFileAsync({ html });
  
  // Check if sharing is available
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }
  
  // Share the PDF
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Reçu ${data.invoiceNumber}`,
    UTI: 'com.adobe.pdf',
  });
};

export const generateReceiptFromSale = (sale: any, warehouse?: any, employee?: any): ReceiptData => {
  return {
    invoiceNumber: sale.invoiceNumber,
    date: new Date(sale.createdAt),
    items: (sale.items || []).map((item: any) => ({
      name: item.product?.name || 'Produit',
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    })),
    subtotal: Number(sale.subtotal),
    discountAmount: Number(sale.discountAmount || 0),
    taxAmount: Number(sale.taxAmount || 0),
    total: Number(sale.total),
    payments: (sale.payments || []).map((p: any) => ({
      method: p.method,
      amount: Number(p.amount),
      amountReceived: p.amountReceived ? Number(p.amountReceived) : undefined,
      changeGiven: p.changeGiven ? Number(p.changeGiven) : undefined,
    })),
    customer: sale.customer,
    employee: employee ? { name: employee.fullName } : null,
    warehouse: warehouse ? {
      name: warehouse.name,
      address: warehouse.address,
      phone: warehouse.phone,
    } : null,
  };
};

