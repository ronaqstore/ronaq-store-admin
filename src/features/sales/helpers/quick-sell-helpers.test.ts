import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildQuickSaleDefaults } from './sale-create-helpers.ts';
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
