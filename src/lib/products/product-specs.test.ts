import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatAuthenticity, formatPtaStatus, getProductSpecBadges } from './product-specs.ts';
import type { ProductDTO } from '@/lib/api/types';

describe('product-specs', () => {
  describe('formatPtaStatus', () => {
    it('returns null for null or undefined', () => {
      assert.equal(formatPtaStatus(null), null);
      assert.equal(formatPtaStatus(undefined), null);
      assert.equal(formatPtaStatus(''), null);
    });

    it('formats known PTA statuses correctly', () => {
      assert.equal(formatPtaStatus('PTA_APPROVED'), 'PTA Approved');
      assert.equal(formatPtaStatus('NON_PTA'), 'Non PTA');
      assert.equal(formatPtaStatus('JV'), 'JV');
      assert.equal(formatPtaStatus('BYPASS'), 'Bypass');
      assert.equal(formatPtaStatus('MDM_BYPASS'), 'MDM Bypass');
    });

    it('gracefully handles unknown status strings', () => {
      assert.equal(formatPtaStatus('CUSTOM_STATUS'), 'CUSTOM STATUS');
    });
  });

  describe('formatAuthenticity', () => {
    it('returns null for null or undefined', () => {
      assert.equal(formatAuthenticity(null), null);
      assert.equal(formatAuthenticity(undefined), null);
      assert.equal(formatAuthenticity(''), null);
    });

    it('formats original and copy', () => {
      assert.equal(formatAuthenticity('ORIGINAL'), 'Original');
      assert.equal(formatAuthenticity('COPY'), 'Copy');
    });
  });

  describe('getProductSpecBadges', () => {
    it('returns empty array when product is null or undefined', () => {
      assert.deepEqual(getProductSpecBadges(null), []);
      assert.deepEqual(getProductSpecBadges(undefined), []);
    });

    it('formats a phone with RAM and storage', () => {
      const product = {
        name: 'Galaxy A15',
        ram: '6GB',
        storage: '128GB',
        color: 'Blue',
        ptaStatus: 'PTA_APPROVED'
      } as unknown as ProductDTO;

      assert.deepEqual(getProductSpecBadges(product), ['6GB / 128GB', 'Blue', 'PTA Approved']);
    });

    it('formats a phone with only storage', () => {
      const product = {
        name: 'iPhone 13',
        storage: '128GB',
        color: 'Midnight',
        ptaStatus: 'NON_PTA'
      } as unknown as ProductDTO;

      assert.deepEqual(getProductSpecBadges(product), ['128GB', 'Midnight', 'Non PTA']);
    });

    it('formats an accessory with authenticity', () => {
      const product = {
        name: '25W Type-C Charger',
        authenticity: 'ORIGINAL'
      } as unknown as ProductDTO;

      assert.deepEqual(getProductSpecBadges(product), ['Original']);
    });

    it('returns empty array when product has no specs', () => {
      const product = {
        name: 'Earbuds'
      } as unknown as ProductDTO;

      assert.deepEqual(getProductSpecBadges(product), []);
    });
  });
});
