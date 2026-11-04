import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildQuickSaleDefaults,
  calcSaleTotals,
  getSalePricingFingerprint
} from './sale-create-helpers.ts';
import { EMPTY_FORM_NUMBER } from '../../../types/common.ts';
import type { ProductDTO } from '../../../lib/api/types.ts';

const mockQuantityProduct: ProductDTO = {
  id: 'prod-qty-123',
  shopId: 'shop-1',
  categoryId: 'cat-1',
  brandId: 'brand-1',
  categoryName: 'Accessories',
  brandName: 'Anker',
  name: 'Anker USB-C Cable',
  trackingType: 'QUANTITY',
  defaultPurchasePrice: 80000,
  defaultSellingPrice: 150000,
  lowStockThreshold: 5,
  isActive: true,
  isPublished: true,
  authenticity: 'ORIGINAL',
  quantityOnHand: 25,
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z'
};

const mockSerializedPhone: ProductDTO = {
  id: 'prod-phone-456',
  shopId: 'shop-1',
  categoryId: 'cat-2',
  brandId: 'brand-2',
  categoryName: 'Smartphones',
  brandName: 'Apple',
  name: 'iPhone 15 Pro',
  trackingType: 'SERIALIZED',
  defaultPurchasePrice: 28000000,
  defaultSellingPrice: 32000000,
  lowStockThreshold: 2,
  isActive: true,
  isPublished: true,
  authenticity: 'ORIGINAL',
  quantityOnHand: 3,
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z'
};

describe('Quick Sell - buildQuickSaleDefaults', () => {
  // 1. HAPPY PATH
  it('correctly builds 1-click cash sale defaults for an active quantity product', () => {
    const defaults = buildQuickSaleDefaults(mockQuantityProduct);

    assert.equal(defaults.customer_id, '__walkin__');
    assert.equal(defaults.discount, EMPTY_FORM_NUMBER);
    // 150000 paisa = Rs 1500
    assert.equal(defaults.paid_now, 1500);
    assert.equal(defaults.lines.length, 1);

    const line = defaults.lines[0];
    assert.equal(line.product_id, 'prod-qty-123');
    assert.equal(line.product_name, 'Anker USB-C Cable');
    assert.equal(line.quantity, 1);
    assert.equal(line.unit_price, 1500);
    assert.equal(line.tracking_type, 'QUANTITY');
    assert.equal(line.authenticity, 'ORIGINAL');
    assert.equal(line.inventory_unit_id, '');
  });

  // 2. NEGATIVE: BOUNDARY / ZERO / MISSING PRICE
  it('handles products with zero, negative, or missing selling price gracefully without NaN', () => {
    const zeroPriceProduct: ProductDTO = {
      ...mockQuantityProduct,
      defaultSellingPrice: 0
    };
    const zeroDefaults = buildQuickSaleDefaults(zeroPriceProduct);

    assert.equal(zeroDefaults.paid_now, EMPTY_FORM_NUMBER);
    assert.equal(zeroDefaults.lines[0].unit_price, EMPTY_FORM_NUMBER);
    assert.notEqual(zeroDefaults.paid_now, Number.NaN);

    const negPriceProduct: ProductDTO = {
      ...mockQuantityProduct,
      defaultSellingPrice: -5000
    };
    const negDefaults = buildQuickSaleDefaults(negPriceProduct);
    assert.equal(negDefaults.paid_now, EMPTY_FORM_NUMBER);
    assert.equal(negDefaults.lines[0].unit_price, EMPTY_FORM_NUMBER);
  });

  // 3. NEGATIVE: ADVERSE & CONFLICTING STATE (SERIALIZED VS QUANTITY INVARIANTS)
  it('enforces empty inventory unit and null authenticity on serialized phones to prevent bypass', () => {
    const phoneDefaults = buildQuickSaleDefaults(mockSerializedPhone);

    assert.equal(phoneDefaults.lines[0].tracking_type, 'SERIALIZED');
    // inventory_unit_id MUST be empty string so schema validation mandates IMEI selection
    assert.equal(phoneDefaults.lines[0].inventory_unit_id, '');
    assert.equal(phoneDefaults.lines[0].authenticity, null);
    assert.equal(phoneDefaults.lines[0].quantity, 1);
    // 32000000 paisa = Rs 320000
    assert.equal(phoneDefaults.lines[0].unit_price, 320000);
    assert.equal(phoneDefaults.paid_now, 320000);
  });

  // 4. NEGATIVE: INACTIVE OR NULL PRODUCT GUARD
  it('safely rejects inactive product or null input and defaults to blank sale form', () => {
    const inactiveProduct: ProductDTO = {
      ...mockQuantityProduct,
      isActive: false
    };

    const inactiveDefaults = buildQuickSaleDefaults(inactiveProduct);
    assert.equal(inactiveDefaults.lines[0].product_id, '');
    assert.equal(inactiveDefaults.lines[0].unit_price, EMPTY_FORM_NUMBER);
    assert.equal(inactiveDefaults.paid_now, EMPTY_FORM_NUMBER);

    const nullDefaults = buildQuickSaleDefaults(null);
    assert.equal(nullDefaults.lines[0].product_id, '');
    assert.equal(nullDefaults.paid_now, EMPTY_FORM_NUMBER);
  });
});

describe('getSalePricingFingerprint', () => {
  const lineItem = {
    product_id: 'prod-1',
    inventory_unit_id: 'unit-1',
    unit_price: 49000,
    quantity: 1
  };

  it('generates deterministic fingerprint for identical inputs', () => {
    const fp1 = getSalePricingFingerprint([lineItem], 0);
    const fp2 = getSalePricingFingerprint([{ ...lineItem }], 0);
    assert.equal(fp1, fp2);
  });

  it('detects unit price change (e.g. from 49k to 55k)', () => {
    const fpBefore = getSalePricingFingerprint([lineItem], 0);
    const fpAfter = getSalePricingFingerprint([{ ...lineItem, unit_price: 55000 }], 0);
    assert.notEqual(fpBefore, fpAfter);
  });

  it('detects discount change', () => {
    const fp1 = getSalePricingFingerprint([lineItem], 0);
    const fp2 = getSalePricingFingerprint([lineItem], 500);
    assert.notEqual(fp1, fp2);
  });

  it('detects quantity or unit change', () => {
    const fp1 = getSalePricingFingerprint([lineItem], 0);
    const fpQty = getSalePricingFingerprint([{ ...lineItem, quantity: 2 }], 0);
    const fpUnit = getSalePricingFingerprint([{ ...lineItem, inventory_unit_id: 'unit-2' }], 0);
    assert.notEqual(fp1, fpQty);
    assert.notEqual(fp1, fpUnit);
  });
});

describe('calcSaleTotals', () => {
  const lines = [
    {
      product_id: 'p1',
      product_name: 'Item 1',
      quantity: 2,
      unit_price: 1000,
      tracking_type: 'QUANTITY' as const,
      inventory_unit_id: ''
    },
    {
      product_id: 'p2',
      product_name: 'Item 2',
      quantity: 1,
      unit_price: 3000,
      tracking_type: 'SERIALIZED' as const,
      inventory_unit_id: 'u1'
    }
  ];

  it('computes subtotal, total, and zero udhar on full payment', () => {
    // subtotal = 2*1000 + 1*3000 = 5000
    const totals = calcSaleTotals(lines, 0, 5000);
    assert.equal(totals.subtotalRs, 5000);
    assert.equal(totals.totalRs, 5000);
    assert.equal(totals.udharRs, 0);
  });

  it('reduces total by discount and reflects udhar when paidNow is partial', () => {
    // subtotal = 5000, discount = 500 => total = 4500. paidNow = 3000 => udhar = 1500
    const totals = calcSaleTotals(lines, 500, 3000);
    assert.equal(totals.subtotalRs, 5000);
    assert.equal(totals.totalRs, 4500);
    assert.equal(totals.udharRs, 1500);
  });

  it('floors total at zero when discount exceeds subtotal', () => {
    const totals = calcSaleTotals(lines, 6000, 0);
    assert.equal(totals.subtotalRs, 5000);
    assert.equal(totals.totalRs, 0);
    assert.equal(totals.udharRs, 0);
  });
});
