import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildProductPayload, emptyProductForm } from './product-form-defaults.ts';
import type { ProductFormValues } from '@/types/products';

const baseValues: ProductFormValues = {
  ...emptyProductForm(),
  name: 'iPhone 13',
  categoryId: 'cat-1',
  brandId: 'brand-1',
  trackingType: 'SERIALIZED',
  defaultPurchasePrice: 150000,
  defaultSellingPrice: 180000,
  lowStockThreshold: 2
};

describe('buildProductPayload', () => {
  describe('create mode', () => {
    it('defaults to create mode and omits empty optional fields as undefined', () => {
      const payload = buildProductPayload({
        ...baseValues,
        model: '',
        color: '   ',
        ram: '',
        storage: '',
        sku: '',
        barcode: '',
        description: '',
        imageUrl: '',
        publicDescription: '',
        ptaStatus: null,
        authenticity: ''
      });

      assert.equal(payload.name, 'iPhone 13');
      assert.equal(payload.categoryId, 'cat-1');
      assert.equal(payload.brandId, 'brand-1');
      assert.equal(payload.defaultPurchasePrice, 15000000);
      assert.equal(payload.defaultSellingPrice, 18000000);
      assert.equal(payload.lowStockThreshold, 2);
      assert.equal(payload.model, undefined);
      assert.equal(payload.color, undefined);
      assert.equal(payload.ram, undefined);
      assert.equal(payload.storage, undefined);
      assert.equal(payload.sku, undefined);
      assert.equal(payload.barcode, undefined);
      assert.equal(payload.description, undefined);
      assert.equal(payload.imageUrl, undefined);
      assert.equal(payload.publicDescription, undefined);
      assert.equal(payload.ptaStatus, undefined);
      assert.equal(payload.authenticity, undefined);
    });

    it('keeps non-empty trimmed values when provided', () => {
      const payload = buildProductPayload(
        {
          ...baseValues,
          model: ' A2633 ',
          color: ' Midnight ',
          ram: ' 4GB ',
          storage: ' 128GB ',
          sku: ' IP13-128 ',
          barcode: ' 1234567890 ',
          description: ' Clean condition ',
          imageUrl: ' https://example.com/img.jpg ',
          publicDescription: ' Great phone ',
          ptaStatus: 'PTA_APPROVED',
          authenticity: 'ORIGINAL'
        },
        'create'
      );

      assert.equal(payload.model, 'A2633');
      assert.equal(payload.color, 'Midnight');
      assert.equal(payload.ram, '4GB');
      assert.equal(payload.storage, '128GB');
      assert.equal(payload.sku, 'IP13-128');
      assert.equal(payload.barcode, '1234567890');
      assert.equal(payload.description, 'Clean condition');
      assert.equal(payload.imageUrl, 'https://example.com/img.jpg');
      assert.equal(payload.publicDescription, 'Great phone');
      assert.equal(payload.ptaStatus, 'PTA_APPROVED');
      assert.equal(payload.authenticity, 'ORIGINAL');
    });

    it('ignores ram, storage, and ptaStatus when trackingType is QUANTITY', () => {
      const payload = buildProductPayload(
        {
          ...baseValues,
          trackingType: 'QUANTITY',
          ram: '8GB',
          storage: '256GB',
          ptaStatus: 'PTA_APPROVED'
        },
        'create'
      );

      assert.equal(payload.trackingType, 'QUANTITY');
      assert.equal(payload.ram, undefined);
      assert.equal(payload.storage, undefined);
      assert.equal(payload.ptaStatus, undefined);
    });
  });

  describe('edit mode', () => {
    it('converts emptied fields to null', () => {
      const payload = buildProductPayload(
        {
          ...baseValues,
          model: '',
          color: '   ',
          ram: '',
          storage: '',
          sku: '',
          barcode: '',
          description: '',
          imageUrl: '',
          publicDescription: '',
          ptaStatus: null,
          authenticity: ''
        },
        'edit'
      );

      assert.equal(payload.name, 'iPhone 13');
      assert.equal(payload.model, null);
      assert.equal(payload.color, null);
      assert.equal(payload.ram, null);
      assert.equal(payload.storage, null);
      assert.equal(payload.sku, null);
      assert.equal(payload.barcode, null);
      assert.equal(payload.description, null);
      assert.equal(payload.imageUrl, null);
      assert.equal(payload.publicDescription, null);
      assert.equal(payload.ptaStatus, null);
      assert.equal(payload.authenticity, null);
    });

    it('forces ram, storage, and ptaStatus to null when trackingType is QUANTITY', () => {
      const payload = buildProductPayload(
        {
          ...baseValues,
          trackingType: 'QUANTITY',
          ram: '8GB',
          storage: '256GB',
          ptaStatus: 'PTA_APPROVED'
        },
        'edit'
      );

      assert.equal(payload.trackingType, 'QUANTITY');
      assert.equal(payload.ram, null);
      assert.equal(payload.storage, null);
      assert.equal(payload.ptaStatus, null);
    });

    it('preserves non-empty fields in edit mode and allows ptaStatus change', () => {
      const payload = buildProductPayload(
        {
          ...baseValues,
          model: 'SM-S918B',
          color: 'Phantom Black',
          ram: '12GB',
          storage: '256GB',
          sku: 'S23U-BLK',
          barcode: '9876543210',
          description: 'Private note',
          imageUrl: 'https://example.com/s23.jpg',
          publicDescription: 'Public description text',
          ptaStatus: 'NON_PTA',
          authenticity: 'ORIGINAL'
        },
        'edit'
      );

      assert.equal(payload.model, 'SM-S918B');
      assert.equal(payload.color, 'Phantom Black');
      assert.equal(payload.ram, '12GB');
      assert.equal(payload.storage, '256GB');
      assert.equal(payload.sku, 'S23U-BLK');
      assert.equal(payload.barcode, '9876543210');
      assert.equal(payload.description, 'Private note');
      assert.equal(payload.imageUrl, 'https://example.com/s23.jpg');
      assert.equal(payload.publicDescription, 'Public description text');
      assert.equal(payload.ptaStatus, 'NON_PTA');
      assert.equal(payload.authenticity, 'ORIGINAL');
    });

    it('clears barcode and sku when cleared while preserving other populated fields', () => {
      const payload = buildProductPayload(
        {
          ...baseValues,
          model: 'iPhone 14',
          color: null,
          barcode: '',
          sku: '  ',
          description: ''
        },
        'edit'
      );

      assert.equal(payload.model, 'iPhone 14');
      assert.equal(payload.color, null);
      assert.equal(payload.barcode, null);
      assert.equal(payload.sku, null);
      assert.equal(payload.description, null);
    });
  });
});
