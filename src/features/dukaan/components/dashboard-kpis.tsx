'use client';

import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { ChartSkeleton } from '@/components/dashboard/chart-skeleton';
import { formatPkrCompact, formatPkrFull } from '@/lib/dashboard/formatters';
import { shopKpisQueryOptions } from '../api/queries';
import { useT } from '@/i18n/use-t';
import type { DashboardKpisProps } from '@/types/dashboard';
import type { KpiCardChange } from '@/types/charts';

export function DashboardKpisRow({ params }: DashboardKpisProps) {
  const t = useT();
  const { data: kpis, isLoading } = useQuery(shopKpisQueryOptions(params));

  if (isLoading || !kpis) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className='rounded-lg border bg-card p-4'>
            <ChartSkeleton type='kpi' />
          </div>
        ))}
      </div>
    );
  }

  const { totals, previousTotals, balance, sparklines } = kpis;

  const calcChange = (
    cur: number,
    prev: number,
    isInverse = false
  ): KpiCardChange | undefined => {
    if (prev <= 0 && cur <= 0) return undefined;
    if (prev <= 0) return { percentage: 100, absolute: cur, isInverse };
    const pct = Math.round(((cur - prev) / prev) * 100 * 10) / 10;
    return { percentage: pct, absolute: cur - prev, isInverse };
  };

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      <KpiCard
        label={t('dashboard.metrics.sales')}
        value={formatPkrCompact(totals.sales)}
        tooltip={t('dashboard.salesTrendTooltip')}
        change={calcChange(totals.sales, previousTotals.sales)}
        sparkline={sparklines.sales}
        sparklineColor='var(--chart-1)'
        href='/dashboard/sales'
      />

      <KpiCard
        label={t('dashboard.metrics.grossProfit')}
        value={formatPkrCompact(totals.grossProfit)}
        tooltip={t('dashboard.profitWaterfallTooltip')}
        change={calcChange(totals.grossProfit, previousTotals.grossProfit)}
        sparkline={sparklines.grossProfit}
        sparklineColor='var(--chart-2)'
      />

      <KpiCard
        label={t('dashboard.metrics.netProfit')}
        value={formatPkrCompact(totals.netProfit)}
        tooltip={t('dashboard.profitWaterfallTooltip')}
        change={calcChange(totals.netProfit, previousTotals.netProfit)}
        sparkline={sparklines.netProfit}
        sparklineColor='var(--chart-3)'
        className={
          totals.netProfit < 0
            ? 'border-rose-500/50 bg-rose-50/20 dark:bg-rose-950/20'
            : ''
        }
      />

      <KpiCard
        label={t('dashboard.metrics.expenses')}
        value={formatPkrCompact(totals.expenses)}
        tooltip={t('dashboard.expensesByCategoryTooltip')}
        change={calcChange(totals.expenses, previousTotals.expenses, true)}
        sparkline={sparklines.expenses}
        sparklineColor='var(--chart-4)'
        href='/dashboard/expenses'
      />

      <KpiCard
        label={t('dashboard.cashPosition')}
        value={formatPkrFull(balance.cashInHand)}
        tooltip={t('dashboard.cashFlowTooltip')}
        href='/dashboard/cash'
      />

      <KpiCard
        label={t('dashboard.customerUdhar')}
        value={formatPkrFull(balance.customerUdhar)}
        tooltip={t('dashboard.receivablesAgingTooltip')}
        href='/dashboard/customers'
      />

      <KpiCard
        label={t('dashboard.supplierPayable')}
        value={formatPkrFull(balance.supplierPayable)}
        tooltip={t('dashboard.supplierPayable')}
        href='/dashboard/suppliers'
      />

      <KpiCard
        label={t('dashboard.lowStock')}
        value={String(balance.lowStockCount)}
        tooltip={t('dashboard.inventoryAgingTooltip')}
        href='/dashboard/inventory'
      />
    </div>
  );
}
