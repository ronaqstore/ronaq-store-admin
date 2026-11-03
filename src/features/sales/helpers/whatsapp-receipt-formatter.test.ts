import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildWhatsAppReceiptText,
  buildWhatsAppReceiptUrl,
  type WhatsAppReceiptData
} from './whatsapp-receipt-formatter.ts';

describe('whatsapp-receipt-formatter', () => {
  const sampleData: WhatsAppReceiptData = {
    shopName: 'Ronaq Mobile Zone',
    saleNo: 'SL-202611-0001',
    saleDate: '2026-11-03',
    customerName: 'Ahmad Khan',
    customerPhone: '03001234567',
    items: [
      {
        productName: 'iPhone 13 128GB Midnight',
        quantity: 1,
        unitPrice: 14500000,
        total: 14500000,
        imei: '354892091234567',
        warrantyDays: 30
      },
      {
        productName: 'Anker 20W Fast Charger',
        quantity: 2,
        unitPrice: 250000,
        total: 500000,
        imei: null,
        warrantyDays: null
      }
    ],
    totalAmount: 15000000,
    paymentMethod: 'CASH'
  };

  it('Happy Path: formats complete receipt with IMEI, warranty, and itemized totals', () => {
    const text = buildWhatsAppReceiptText(sampleData);

    assert.ok(text.includes('RONAQ MOBILE ZONE'));
    assert.ok(text.includes('#SL-202611-0001'));
    assert.ok(text.includes('Ahmad Khan'));
    assert.ok(text.includes('iPhone 13 128GB Midnight'));
    assert.ok(text.includes('IMEI: 354892091234567'));
    assert.ok(text.includes('30 Days Shop Warranty'));
    assert.ok(text.includes('Anker 20W Fast Charger'));
    assert.ok(text.includes('Qty: 2'));
    assert.ok(text.includes('Payment: CASH'));
  });

  it('Negative 1: cleanly omits warranty line when warrantyDays is null, 0, or undefined', () => {
    const data: WhatsAppReceiptData = {
      ...sampleData,
      items: [
        {
          productName: 'Silicone Case',
          quantity: 1,
          unitPrice: 50000,
          total: 50000,
          warrantyDays: 0
        }
      ]
    };
    const text = buildWhatsAppReceiptText(data);
    assert.ok(!text.includes('Warranty'));
  });

  it('Negative 2: gracefully handles missing customer name, phone, or shop name', () => {
    const data: WhatsAppReceiptData = {
      ...sampleData,
      shopName: undefined,
      customerName: null,
      customerPhone: null
    };
    const text = buildWhatsAppReceiptText(data);
    assert.ok(text.includes('RONAQ STORE'));
    assert.ok(!text.includes('Customer:'));
  });

  it('Negative 3: builds clean URL stripping punctuation and spaces from phone number', () => {
    const url = buildWhatsAppReceiptUrl('+92 300-1234567', 'Hello');
    assert.equal(url.startsWith('https://wa.me/923001234567?text=Hello'), true);
  });
});
