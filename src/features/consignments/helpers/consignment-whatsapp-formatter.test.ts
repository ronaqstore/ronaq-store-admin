import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildConsignmentWhatsAppText,
  buildConsignmentWhatsAppUrl
} from './consignment-whatsapp-formatter.ts';
import type { ConsignmentDTO } from '@/lib/api/types';

describe('consignment-whatsapp-formatter', () => {
  const sampleConsignment: ConsignmentDTO = {
    id: '01924f0a-0000-7000-8000-000000000001',
    consignmentNo: 'CON-0001',
    customerId: null,
    customerName: null,
    consignorName: 'Usman Ali',
    consignorPhone: '03001234567',
    consignorCnic: '12345-1234567-1',
    productId: 'prod-1',
    productName: 'iPhone 14 Pro Max 256GB',
    imei1: '354678123456789',
    imei2: '354678123456780',
    condition: 'USED',
    batteryHealth: 88,
    defectNotes: 'Minor scratch on bezel',
    agreedPayout: 210000,
    targetSellingPrice: 220000,
    status: 'IN_CUSTODY',
    intakeDate: '2026-11-03',
    inventoryUnitId: 'unit-1',
    saleItemId: null,
    soldAt: null,
    soldPrice: null,
    settledAt: null,
    settledAmount: null,
    payoutMethod: null,
    payoutReference: null,
    returnedAt: null,
    returnReason: null,
    cancelledAt: null,
    cancelReason: null,
    notes: null,
    createdAt: '2026-11-03T10:00:00Z',
    updatedAt: '2026-11-03T10:00:00Z'
  };

  it('formats intake slip WhatsApp text with all details', () => {
    const text = buildConsignmentWhatsAppText({
      consignment: sampleConsignment,
      shopName: 'Al-Madina Mobile',
      shopPhone: '03219876543',
      type: 'intake'
    });

    assert.ok(text.includes('AL-MADINA MOBILE'));
    assert.ok(text.includes('03219876543'));
    assert.ok(text.includes('#CON-0001'));
    assert.ok(text.includes('Usman Ali'));
    assert.ok(text.includes('03001234567'));
    assert.ok(text.includes('12345-1234567-1'));
    assert.ok(text.includes('iPhone 14 Pro Max 256GB'));
    assert.ok(text.includes('354678123456789'));
    assert.ok(text.includes('354678123456780'));
    assert.ok(text.includes('88%'));
    assert.ok(text.includes('Minor scratch on bezel'));
    assert.ok(text.includes('AGREED PAYOUT'));
    assert.ok(text.includes('TERMS / شرائط'));
  });

  it('formats settlement receipt WhatsApp text', () => {
    const settledConsignment: ConsignmentDTO = {
      ...sampleConsignment,
      status: 'SETTLED',
      settledAt: '2026-11-05T12:00:00Z',
      settledAmount: 210000,
      payoutMethod: 'CASH',
      payoutReference: 'CASH-PAY-01'
    };

    const text = buildConsignmentWhatsAppText({
      consignment: settledConsignment,
      shopName: 'Al-Madina Mobile',
      type: 'settlement'
    });

    assert.ok(text.includes('AMANAT SETTLEMENT RECEIPT'));
    assert.ok(text.includes('AMOUNT PAID TO OWNER'));
    assert.ok(text.includes('CASH'));
    assert.ok(text.includes('CASH-PAY-01'));
    assert.ok(text.includes('PAID IN FULL / مکمل وصول شدہ'));
  });

  it('generates valid wa.me URL with phone and message', () => {
    const url = buildConsignmentWhatsAppUrl('0300 123 4567', 'Hello Amanat');
    assert.ok(url.startsWith('https://wa.me/'));
    assert.ok(url.includes('Hello%20Amanat'));
  });
});
