import { formatIsoDate } from '@/lib/dates';
import { formatPkr } from '@/lib/dukaan/numbers';
import { whatsappReminderUrl } from '@/constants/api';
import type { ConsignmentWhatsAppOptions } from '@/types/consignments';

export function buildConsignmentWhatsAppText(options: ConsignmentWhatsAppOptions): string {
  const { consignment, shopName, shopPhone, type } = options;
  const shop = shopName?.trim() || 'Ronaq Store';
  const isIntake = type === 'intake';
  const lines: string[] = [];

  lines.push(`📱 *${shop.toUpperCase()}*`);
  if (shopPhone?.trim()) {
    lines.push(`📞 Contact: ${shopPhone.trim()}`);
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  if (isIntake) {
    lines.push(`📋 *AMANAT RECEIVING SLIP:* #${consignment.consignmentNo}`);
    lines.push(`📅 *Date:* ${formatIsoDate(consignment.intakeDate)}`);
  } else {
    lines.push(`📋 *AMANAT SETTLEMENT RECEIPT:* #${consignment.consignmentNo}`);
    lines.push(
      `📅 *Date:* ${formatIsoDate(String(consignment.settledAt ?? consignment.updatedAt ?? new Date().toISOString()))}`
    );
  }

  lines.push(`👤 *Phone Owner:* ${consignment.consignorName}`);
  lines.push(`📞 *Phone:* ${consignment.consignorPhone}`);
  if (consignment.consignorCnic) {
    lines.push(`🪪 *CNIC:* ${consignment.consignorCnic}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(isIntake ? `📱 *DEVICE RECEIVED (AMANAT):*` : `📱 *DEVICE DETAILS:*`);
  lines.push(`• *Model:* ${consignment.productName}`);
  lines.push(`• *IMEI 1:* ${consignment.imei1}`);
  if (consignment.imei2) {
    lines.push(`• *IMEI 2:* ${consignment.imei2}`);
  }
  lines.push(`• *Condition:* ${consignment.condition === 'NEW' ? 'New / Pin-Pack' : 'Used'}`);
  if (consignment.batteryHealth != null) {
    lines.push(`• *Battery Health:* ${consignment.batteryHealth}%`);
  }
  if (consignment.defectNotes?.trim()) {
    lines.push(`• *Inspection Notes:* ${consignment.defectNotes.trim()}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  if (isIntake) {
    lines.push(`💰 *AGREED PAYOUT:* *${formatPkr(consignment.agreedPayout)}*`);
    if (consignment.targetSellingPrice != null) {
      lines.push(`🏷️ *Target Asking Price:* ${formatPkr(consignment.targetSellingPrice)}`);
    }
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`⚖️ *TERMS / شرائط:*`);
    lines.push(
      `مذکورہ موبائل فون مالک کی رضامندی سے دکان پر برائے فروخت امانت کے طور پر رکھوایا گیا ہے۔ فروخت ہونے کی صورت میں متفقہ رقم ادا کی جائے گی۔ واپسی کی صورت میں بغیر کسی کٹوتی کے فون واپس دیا جائے گا۔`
    );
  } else {
    const paidAmount = consignment.settledAmount ?? consignment.agreedPayout;
    lines.push(`💰 *AMOUNT PAID TO OWNER:* *${formatPkr(paidAmount)}*`);
    if (consignment.payoutMethod) {
      lines.push(`💳 *Payment Method:* ${consignment.payoutMethod}`);
    }
    if (consignment.payoutReference) {
      lines.push(`🧾 *Reference / Trx ID:* ${consignment.payoutReference}`);
    }
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`✅ *PAID IN FULL / مکمل وصول شدہ:*`);
    lines.push(
      `میں اقرار کرتا ہوں کہ میں نے اپنے مذکورہ موبائل فون کی متفقہ رقم مکمل وصول کر لی ہے اور اب اس فون کے حوالے سے میرا کوئی مطالبہ باقی نہیں ہے۔`
    );
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`✨ *Thank you for trusting ${shop}!*`);

  return lines.join('\n');
}

export function buildConsignmentWhatsAppUrl(phone: string, text: string): string {
  return whatsappReminderUrl(phone, text);
}
