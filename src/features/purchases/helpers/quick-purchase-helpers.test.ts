import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildQuickPurchaseDefaults } from './purchase-create-helpers.ts';
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

describe('Quick Purchase - buildQuickPurchaseDefaults', () => {
  // 1. HAPPY PATH
  it('correctly builds purchase defaults for an active quantity product', () => {
    const defaults = buildQuickPurchaseDefaults(mockQuantityProduct);

    assert.equal(defaults.supplier_id, '');
    assert.equal(defaults.supplier_invoice_ref, '');
    assert.equal(defaults.is_opening_stock, false);
    // 80000 paisa = Rs 800
    assert.equal(defaults.paid_now, 800);
    assert.equal(defaults.lines.length, 1);

    const line = defaults.lines[0];
    assert.equal(line.product_id, 'prod-qty-123');
    assert.equal(line.product_label, 'Anker USB-C Cable');
    assert.equal(line.quantity, 1);
    assert.equal(line.unit_cost, 800);
    assert.equal(line.tracking_type, 'QUANTITY');
    assert.equal(line.phone_units.length, 0);
  });

  // 2. NEGATIVE: BOUNDARY / ZERO / MISSING PRICE
  it('handles products with zero, negative, or missing purchase price gracefully without NaN', () => {
    const zeroPriceProduct: ProductDTO = {
      ...mockQuantityProduct,
      defaultPurchasePrice: 0
    };
    const zeroDefaults = buildQuickPurchaseDefaults(zeroPriceProduct);

    assert.equal(zeroDefaults.paid_now, EMPTY_FORM_NUMBER);
    assert.equal(zeroDefaults.lines[0].unit_cost, EMPTY_FORM_NUMBER);
    assert.notEqual(zeroDefaults.paid_now, Number.NaN);

    const negPriceProduct: ProductDTO = {
      ...mockQuantityProduct,
      defaultPurchasePrice: -4000
    };
    const negDefaults = buildQuickPurchaseDefaults(negPriceProduct);
    assert.equal(negDefaults.paid_now, EMPTY_FORM_NUMBER);
    assert.equal(negDefaults.lines[0].unit_cost, EMPTY_FORM_NUMBER);
  });

  // 3. NEGATIVE: ADVERSE & CONFLICTING STATE (SERIALIZED PHONE UNIT INITIALIZATION)
  it('initializes empty phone units for serialized products so IMEI validation is mandated', () => {
    const phoneDefaults = buildQuickPurchaseDefaults(mockSerializedPhone);

    assert.equal(phoneDefaults.lines[0].tracking_type, 'SERIALIZED');
    assert.equal(phoneDefaults.lines[0].phone_units.length, 1);
    assert.equal(phoneDefaults.lines[0].phone_units[0].imei1, '');
    assert.equal(phoneDefaults.lines[0].phone_units[0].imei2, '');
    assert.equal(phoneDefaults.lines[0].quantity, 1);
    // 28000000 paisa = Rs 280000
    assert.equal(phoneDefaults.lines[0].unit_cost, 280000);
    assert.equal(phoneDefaults.paid_now, 280000);
  });

  // 4. NEGATIVE: INACTIVE OR NULL PRODUCT GUARD
  it('safely rejects inactive product or null input and defaults to blank purchase line', () => {
    const inactiveProduct: ProductDTO = {
      ...mockQuantityProduct,
      isActive: false
    };

    const inactiveDefaults = buildQuickPurchaseDefaults(inactiveProduct);
    assert.equal(inactiveDefaults.lines[0].product_id, '');
    assert.equal(inactiveDefaults.lines[0].unit_cost, EMPTY_FORM_NUMBER);
    assert.equal(inactiveDefaults.paid_now, EMPTY_FORM_NUMBER);

    const nullDefaults = buildQuickPurchaseDefaults(null);
    assert.equal(nullDefaults.lines[0].product_id, '');
    assert.equal(nullDefaults.paid_now, EMPTY_FORM_NUMBER);
  });
});
