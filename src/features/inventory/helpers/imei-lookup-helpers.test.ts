import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calculateProfitDisplay,
  formatPtaStatusLabel,
  formatWarrantyBadge
} from './imei-lookup-helpers.ts';
import type { ImeiSaleInfoDto } from '@/lib/api/types';

describe('imei-lookup-helpers', () => {
  describe('Happy Path', () => {
    it('correctly calculates profit and formats active warranty & PTA labels', () => {
      // 1. Profit calculation
      const profit = calculateProfitDisplay(8400000, 9200000);
      assert.equal(profit.hasSold, true);
      assert.equal(profit.profitPaisa, 800000);
      assert.equal(profit.marginPercent, 8.7);
      assert.equal(profit.isProfitable, true);

      // 2. Active shop warranty badge
      const activeSale: ImeiSaleInfoDto = {
        saleId: 's1',
        saleNo: 'S-001',
        saleDate: '2026-10-15',
        saleStatus: 'ACTIVE',
        salePrice: 9200000,
        profitAmount: 800000,
        profitMarginPercent: 8.7,
        warrantyType: 'SHOP_WARRANTY',
        warrantyDays: 3,
        warrantyEndsAt: '2026-10-18',
        warrantyDaysLeft: 2,
        isWarrantyActive: true
      };
      const badge = formatWarrantyBadge(activeSale);
      assert.equal(badge.isActive, true);
      assert.equal(badge.label, 'Shop Checking Warranty (Active)');
      assert.ok(badge.detail?.includes('2 days left'));

      // 3. PTA formatting
      assert.equal(formatPtaStatusLabel('PTA_APPROVED'), 'PTA Approved');
      assert.equal(formatPtaStatusLabel('NON_PTA'), 'Non-PTA');
      assert.equal(formatPtaStatusLabel('CPID'), 'CPID Approved');
    });
  });

  describe('Negative 1: Boundary, Zero & Malformed Inputs', () => {
    it('handles zero sale price, negative cost, and non-finite values safely', () => {
      // Zero sale price does not cause division by zero / NaN
      const zeroSale = calculateProfitDisplay(100000, 0);
      assert.equal(zeroSale.hasSold, true);
      assert.equal(zeroSale.profitPaisa, -100000);
      assert.equal(zeroSale.marginPercent, 0);
      assert.equal(zeroSale.isProfitable, false);

      // NaN or null sale price returns hasSold: false
      const nullSale = calculateProfitDisplay(100000, null);
      assert.equal(nullSale.hasSold, false);
      assert.equal(nullSale.profitPaisa, 0);

      const nanCost = calculateProfitDisplay(Number.NaN, 50000);
      assert.equal(nanCost.hasSold, true);
      assert.equal(nanCost.profitPaisa, 50000);
      assert.equal(nanCost.marginPercent, 100);
    });
  });

  describe('Negative 2: State & Lifecycle Transitions', () => {
    it('formats unsold items, expired warranties, and no-warranty states', () => {
      // Unsold
      const unsold = formatWarrantyBadge(null);
      assert.equal(unsold.label, 'Not Sold');
      assert.equal(unsold.isActive, false);

      // Expired warranty
      const expiredSale: ImeiSaleInfoDto = {
        saleId: 's2',
        saleNo: 'S-002',
        saleDate: '2026-10-01',
        saleStatus: 'ACTIVE',
        salePrice: 5000000,
        profitAmount: 500000,
        profitMarginPercent: 10,
        warrantyType: 'SHOP_WARRANTY',
        warrantyDays: 3,
        warrantyEndsAt: '2026-10-04',
        warrantyDaysLeft: 0,
        isWarrantyActive: false
      };
      const expiredBadge = formatWarrantyBadge(expiredSale);
      assert.equal(expiredBadge.isActive, false);
      assert.equal(expiredBadge.label, 'Shop Checking Warranty (Expired)');
      assert.equal(expiredBadge.detail, 'Expired on 2026-10-04');

      // No warranty
      const noWarrantySale: ImeiSaleInfoDto = {
        ...expiredSale,
        warrantyType: 'NO_WARRANTY'
      };
      const noWarrantyBadge = formatWarrantyBadge(noWarrantySale);
      assert.equal(noWarrantyBadge.label, 'No Warranty');
      assert.equal(noWarrantyBadge.isActive, false);
    });
  });

  describe('Negative 3: Malformed & Unrecognized PTA Statuses', () => {
    it('handles undefined, null, empty string, and unrecognized PTA values gracefully', () => {
      assert.equal(formatPtaStatusLabel(null), 'Not Specified');
      assert.equal(formatPtaStatusLabel(undefined), 'Not Specified');
      assert.equal(formatPtaStatusLabel(''), 'Not Specified');
      assert.equal(formatPtaStatusLabel('CUSTOM_CARRIER_LOCK'), 'CUSTOM CARRIER LOCK');
      assert.equal(formatPtaStatusLabel('jv'), 'JV (SIM Lock)');
    });
  });
});
