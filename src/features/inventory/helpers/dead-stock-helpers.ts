import type { DeadStockAgingBucket, DeadStockSummaryDto } from '@/lib/api/types';
import type {
  AgingBucketMeta,
  DeadStockCalculatedMetrics,
  DiscountMarginInfo
} from '@/types/inventory';

export function getAgingBucketMeta(bucket: DeadStockAgingBucket): AgingBucketMeta {
  switch (bucket) {
    case '0-15':
      return {
        bucket: '0-15',
        label: '0–15 Days',
        badgeLabel: 'Fresh Stock',
        riskLevel: 'fresh',
        isDeadStock: false,
        isSlowMoving: false,
        borderClass: 'border-emerald-500/30 dark:border-emerald-500/20',
        bgLightClass: 'bg-emerald-50/50 dark:bg-emerald-950/20',
        textClass: 'text-emerald-700 dark:text-emerald-400',
        badgeVariant: 'outline'
      };
    case '16-30':
      return {
        bucket: '16-30',
        label: '16–30 Days',
        badgeLabel: 'Normal',
        riskLevel: 'normal',
        isDeadStock: false,
        isSlowMoving: false,
        borderClass: 'border-blue-500/30 dark:border-blue-500/20',
        bgLightClass: 'bg-blue-50/50 dark:bg-blue-950/20',
        textClass: 'text-blue-700 dark:text-blue-400',
        badgeVariant: 'secondary'
      };
    case '31-60':
      return {
        bucket: '31-60',
        label: '31–60 Days',
        badgeLabel: 'Slow Moving',
        riskLevel: 'warning',
        isDeadStock: false,
        isSlowMoving: true,
        borderClass: 'border-amber-500/30 dark:border-amber-500/20',
        bgLightClass: 'bg-amber-50/50 dark:bg-amber-950/20',
        textClass: 'text-amber-700 dark:text-amber-400',
        badgeVariant: 'outline'
      };
    case '60+':
    default:
      return {
        bucket: '60+',
        label: '60+ Days',
        badgeLabel: 'Dead Stock (Maal-e-Dum)',
        riskLevel: 'critical',
        isDeadStock: true,
        isSlowMoving: false,
        borderClass: 'border-rose-500/30 dark:border-rose-500/20',
        bgLightClass: 'bg-rose-50/50 dark:bg-rose-950/20',
        textClass: 'text-rose-700 dark:text-rose-400',
        badgeVariant: 'destructive'
      };
  }
}

export function calculateDeadStockMetrics(
  summary?: DeadStockSummaryDto | null
): DeadStockCalculatedMetrics {
  if (!summary) {
    return {
      totalInStockUnits: 0,
      totalStockValue: 0,
      deadStockCount: 0,
      deadStockCostValue: 0,
      averageDaysOnShelf: 0,
      deadStockCountPercent: 0,
      deadStockValuePercent: 0,
      isHighRisk: false
    };
  }

  const totalUnits =
    Number.isFinite(summary.totalInStockUnits) && summary.totalInStockUnits > 0
      ? summary.totalInStockUnits
      : 0;
  const deadCount =
    Number.isFinite(summary.deadStockCount) && summary.deadStockCount > 0
      ? summary.deadStockCount
      : 0;
  const totalValue =
    Number.isFinite(summary.totalStockValue) && summary.totalStockValue > 0
      ? summary.totalStockValue
      : 0;
  const deadValue =
    Number.isFinite(summary.deadStockCostValue) && summary.deadStockCostValue > 0
      ? summary.deadStockCostValue
      : 0;
  const avgDays =
    Number.isFinite(summary.averageDaysOnShelf) && summary.averageDaysOnShelf > 0
      ? Math.round(summary.averageDaysOnShelf)
      : 0;

  const deadStockCountPercent =
    totalUnits > 0 ? Math.round((deadCount / totalUnits) * 1000) / 10 : 0;
  const deadStockValuePercent =
    totalValue > 0 ? Math.round((deadValue / totalValue) * 1000) / 10 : 0;

  return {
    totalInStockUnits: totalUnits,
    totalStockValue: totalValue,
    deadStockCount: deadCount,
    deadStockCostValue: deadValue,
    averageDaysOnShelf: avgDays,
    deadStockCountPercent,
    deadStockValuePercent,
    isHighRisk: deadStockCountPercent >= 20 || deadCount >= 10
  };
}

export function formatDaysOnShelf(days: number): string {
  const safeDays = Number.isFinite(days) ? Math.max(0, Math.floor(days)) : 0;
  return safeDays === 1 ? '1 day' : `${safeDays} days`;
}

export function calculateDiscountMargin(
  unitCost: number,
  askingPrice?: number | null
): DiscountMarginInfo {
  const safeCost = Number.isFinite(unitCost) && unitCost > 0 ? unitCost : 0;
  if (askingPrice == null || !Number.isFinite(askingPrice) || askingPrice <= 0) {
    return {
      hasAskingPrice: false,
      askingPricePaisa: 0,
      unitCostPaisa: safeCost,
      marginPaisa: 0,
      marginPercent: 0,
      isAboveCost: false
    };
  }

  const marginPaisa = askingPrice - safeCost;
  const marginPercent = Math.round((marginPaisa / askingPrice) * 1000) / 10;

  return {
    hasAskingPrice: true,
    askingPricePaisa: askingPrice,
    unitCostPaisa: safeCost,
    marginPaisa,
    marginPercent,
    isAboveCost: marginPaisa > 0
  };
}
