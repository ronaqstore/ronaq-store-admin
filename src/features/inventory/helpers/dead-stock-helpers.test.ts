import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calculateDeadStockMetrics,
  calculateDiscountMargin,
  formatDaysOnShelf,
  getAgingBucketMeta
} from './dead-stock-helpers.ts';
import type { DeadStockAgingBucket, DeadStockSummaryDto } from '@/lib/api/types';

describe('dead-stock-helpers', () => {
  describe('Happy Path', () => {
    it('correctly returns metadata, formats metrics, days, and discount margins', () => {
      const meta015 = getAgingBucketMeta('0-15');
      assert.equal(meta015.label, '0–15 Days');
      assert.equal(meta015.badgeLabel, 'Fresh Stock');
      assert.equal(meta015.riskLevel, 'fresh');
      assert.equal(meta015.isDeadStock, false);

      const meta60 = getAgingBucketMeta('60+');
      assert.equal(meta60.label, '60+ Days');
      assert.equal(meta60.badgeLabel, 'Dead Stock (Maal-e-Dum)');
      assert.equal(meta60.riskLevel, 'critical');
      assert.equal(meta60.isDeadStock, true);

      const summary: DeadStockSummaryDto = {
        totalInStockUnits: 100,
        totalStockValue: 500000000,
        deadStockCount: 15,
        deadStockCostValue: 75000000,
        averageDaysOnShelf: 28.4,
        buckets: [
          { bucket: '0-15', label: '0-15 Days', count: 50, costValue: 250000000 },
          { bucket: '16-30', label: '16-30 Days', count: 25, costValue: 125000000 },
          { bucket: '31-60', label: '31-60 Days', count: 10, costValue: 50000000 },
          { bucket: '60+', label: '60+ Days', count: 15, costValue: 75000000 }
        ]
      };
      const metrics = calculateDeadStockMetrics(summary);
      assert.equal(metrics.totalInStockUnits, 100);
      assert.equal(metrics.deadStockCount, 15);
      assert.equal(metrics.deadStockCountPercent, 15);
      assert.equal(metrics.deadStockValuePercent, 15);
      assert.equal(metrics.averageDaysOnShelf, 28);
      assert.equal(metrics.isHighRisk, true);

      assert.equal(formatDaysOnShelf(1), '1 day');
      assert.equal(formatDaysOnShelf(45), '45 days');

      const margin = calculateDiscountMargin(8000000, 9000000);
      assert.equal(margin.hasAskingPrice, true);
      assert.equal(margin.marginPaisa, 1000000);
      assert.equal(margin.marginPercent, 11.1);
      assert.equal(margin.isAboveCost, true);
    });
  });

  describe('Negative 1: Boundary, Zero & Malformed Inputs', () => {
    it('handles null/undefined summary, zero counts, and non-finite numbers safely', () => {
      const nullMetrics = calculateDeadStockMetrics(null);
      assert.equal(nullMetrics.totalInStockUnits, 0);
      assert.equal(nullMetrics.deadStockCountPercent, 0);
      assert.equal(nullMetrics.isHighRisk, false);

      const zeroSummary: DeadStockSummaryDto = {
        totalInStockUnits: 0,
        totalStockValue: 0,
        deadStockCount: 0,
        deadStockCostValue: 0,
        averageDaysOnShelf: 0,
        buckets: []
      };
      const zeroMetrics = calculateDeadStockMetrics(zeroSummary);
      assert.equal(zeroMetrics.deadStockCountPercent, 0);
      assert.equal(zeroMetrics.deadStockValuePercent, 0);
      assert.equal(zeroMetrics.isHighRisk, false);

      assert.equal(formatDaysOnShelf(-10), '0 days');
      assert.equal(formatDaysOnShelf(Number.NaN), '0 days');

      const noAsking = calculateDiscountMargin(5000000, null);
      assert.equal(noAsking.hasAskingPrice, false);
      assert.equal(noAsking.marginPaisa, 0);
      assert.equal(noAsking.marginPercent, 0);
      assert.equal(noAsking.isAboveCost, false);
    });
  });

  describe('Negative 2: State & Lifecycle Transitions', () => {
    it('evaluates loss-making margins, exact-cost asking prices, and high-risk triggers', () => {
      const atCost = calculateDiscountMargin(5000000, 5000000);
      assert.equal(atCost.hasAskingPrice, true);
      assert.equal(atCost.marginPaisa, 0);
      assert.equal(atCost.marginPercent, 0);
      assert.equal(atCost.isAboveCost, false);

      const belowCost = calculateDiscountMargin(6000000, 5000000);
      assert.equal(belowCost.hasAskingPrice, true);
      assert.equal(belowCost.marginPaisa, -1000000);
      assert.equal(belowCost.marginPercent, -20);
      assert.equal(belowCost.isAboveCost, false);

      const highPctSummary: DeadStockSummaryDto = {
        totalInStockUnits: 20,
        totalStockValue: 100000000,
        deadStockCount: 5,
        deadStockCostValue: 25000000,
        averageDaysOnShelf: 55,
        buckets: []
      };
      const highPctMetrics = calculateDeadStockMetrics(highPctSummary);
      assert.equal(highPctMetrics.deadStockCountPercent, 25);
      assert.equal(highPctMetrics.isHighRisk, true);
    });
  });

  describe('Negative 3: Extreme Edge Values & Unknown Buckets', () => {
    it('handles unexpected bucket strings and non-finite summary properties', () => {
      const unknownBucketMeta = getAgingBucketMeta('UNKNOWN' as DeadStockAgingBucket);
      assert.equal(unknownBucketMeta.bucket, '60+');
      assert.equal(unknownBucketMeta.isDeadStock, true);

      const malformedSummary: DeadStockSummaryDto = {
        totalInStockUnits: Number.NaN,
        totalStockValue: Number.POSITIVE_INFINITY,
        deadStockCount: -5,
        deadStockCostValue: Number.NaN,
        averageDaysOnShelf: Number.NaN,
        buckets: []
      };
      const malformedMetrics = calculateDeadStockMetrics(malformedSummary);
      assert.equal(malformedMetrics.totalInStockUnits, 0);
      assert.equal(malformedMetrics.totalStockValue, 0);
      assert.equal(malformedMetrics.deadStockCount, 0);
      assert.equal(malformedMetrics.deadStockCountPercent, 0);
      assert.equal(malformedMetrics.isHighRisk, false);
    });
  });
});
