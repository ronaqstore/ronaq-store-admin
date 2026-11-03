import { formatPkr } from '@/lib/money';
import { whatsappReminderUrl } from '@/constants/api';
import type { WhatsAppReceiptData } from '@/types/barcode';

export function buildWhatsAppReceiptText(data: WhatsAppReceiptData): string {
  const shop = data.shopName?.trim() || 'Ronaq Store';
  const lines: string[] = [];

  lines.push(`🧾 *${shop.toUpperCase()}*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📋 *Invoice:* #${data.saleNo}`);
  if (data.saleDate) {
    lines.push(`📅 *Date:* ${data.saleDate}`);
  }
  if (data.customerName) {
    lines.push(`👤 *Customer:* ${data.customerName}`);
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`🛍️ *PURCHASED ITEMS:*`);

  data.items.forEach((item, idx) => {
    lines.push('');
    lines.push(`${idx + 1}. *${item.productName}*`);
    if (item.imei) {
      lines.push(`   IMEI: ${item.imei}`);
    }
    if (item.quantity > 1) {
      lines.push(
        `   Qty: ${item.quantity} × ${formatPkr(item.unitPrice)} = *${formatPkr(item.total)}*`
      );
    } else {
      lines.push(`   Price: *${formatPkr(item.total)}*`);
    }
    if (item.warrantyDays && item.warrantyDays > 0) {
      lines.push(`   🛡️ *Warranty:* ${item.warrantyDays} Days Shop Warranty`);
    }
  });

  lines.push('');
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  if (data.discount && data.discount > 0) {
    lines.push(`Discount: -${formatPkr(data.discount)}`);
  }
  lines.push(`*TOTAL PAID:* *${formatPkr(data.totalAmount)}*`);
  if (data.paymentMethod) {
    lines.push(`Payment: ${data.paymentMethod}`);
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`✨ Thank you for shopping with us!`);

  return lines.join('\n');
}

export function buildWhatsAppReceiptUrl(phone: string, text: string): string {
  return whatsappReminderUrl(phone, text);
}
