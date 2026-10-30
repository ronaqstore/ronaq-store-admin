'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from '@/components/dashboard/chart-card';
import {
  formatDateLabel,
  formatNumber,
  formatPkrCompact,
  formatPkrFull,
} from '@/lib/dashboard/formatters';
import {
  shopProfitWaterfallQueryOptions,
  shopSalesTrendQueryOptions,
} from '../api/queries';
import { useT } from '@/i18n/use-t';
import type { DashboardRow2Props } from '@/types/dashboard';

export function DashboardRow2SalesProfit({ params, compare = false }: DashboardRow2Props) {
  const t = useT();

  const {
    data: trend,
    isLoading: isTrendLoading,
    error: trendError,
    refetch: refetchTrend,
  } = useQuery(shopSalesTrendQueryOptions(params));

  const {
    data: waterfall,
    isLoading: isWaterfallLoading,
    error: waterfallError,
    refetch: refetchWaterfall,
  } = useQuery(shopProfitWaterfallQueryOptions(params));

  const trendSeries = trend?.series ?? [];
  const prevTrendSeries = trend?.previousSeries ?? [];

  const trendChartData = trendSeries.map((item, idx) => {
    const prevItem = prevTrendSeries[idx];
    return {
      date: item.date,
      displayDate: formatDateLabel(item.date),
      sales: item.sales,
      grossProfit: item.grossProfit,
      netProfit: item.netProfit,
      ordersCount: item.ordersCount,
      prevSales: prevItem ? prevItem.sales : undefined,
    };
  });

  const trendTableColumns = [
    { key: 'displayDate', label: t('dashboard.metrics.date') },
    { key: 'formattedSales', label: t('dashboard.metrics.sales'), align: 'right' as const },
    { key: 'formattedGrossProfit', label: t('dashboard.metrics.grossProfit'), align: 'right' as const },
    { key: 'formattedNetProfit', label: t('dashboard.metrics.netProfit'), align: 'right' as const },
    { key: 'ordersCount', label: t('dashboard.metrics.units'), align: 'right' as const },
  ];

  const trendTableRows = trendSeries.map((s) => ({
    displayDate: formatDateLabel(s.date),
    formattedSales: formatPkrFull(s.sales),
    formattedGrossProfit: formatPkrFull(s.grossProfit),
    formattedNetProfit: formatPkrFull(s.netProfit),
    ordersCount: s.ordersCount,
  }));

  const waterfallSteps = waterfall?.steps ?? [];
  const waterfallChartData = waterfallSteps.map((step) => ({
    name: step.name,
    amount: Math.abs(step.amount),
    signedAmount: step.amount,
    displayAmount: formatPkrCompact(step.amount),
    runningTotal: step.runningTotal,
    isNegative: step.isNegative,
  }));

  const waterfallTableColumns = [
    { key: 'name', label: t('dashboard.metrics.step') },
    { key: 'amount', label: t('dashboard.metrics.amount'), align: 'right' as const },
    { key: 'runningTotal', label: t('dashboard.metrics.closingBalance'), align: 'right' as const },
  ];

  const waterfallTableRows = waterfallSteps.map((step) => ({
    name: step.name,
    amount: formatPkrFull(step.amount),
    runningTotal: formatPkrFull(step.runningTotal),
  }));

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
      <div className='lg:col-span-7'>
        <ChartCard
          title={t('dashboard.salesTrendTitle')}
          tooltip={t('dashboard.salesTrendTooltip')}
          isLoading={isTrendLoading}
          error={trendError as Error}
          onRetry={refetchTrend}
          isEmpty={trendSeries.length === 0}
          emptyActionHref='/dashboard/sales'
          emptyActionLabel={t('dashboard.actions.recordSale')}
          skeletonType='line'
          tableColumns={trendTableColumns}
          tableRows={trendTableRows}
          csvFilename='sales-profit-trend'
        >
          <ResponsiveContainer width='100%' height={320}>
            <ComposedChart data={trendChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-muted/40' />
              <XAxis dataKey='displayDate' className='text-xs' tickLine={false} />
              <YAxis
                tickFormatter={(val: number) => formatPkrCompact(val)}
                className='text-xs'
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0].payload;
                  return (
                    <div className='rounded-lg border bg-background p-2.5 shadow-md text-xs'>
                      <div className='font-semibold text-foreground'>{data.displayDate}</div>
                      <div className='mt-1.5 flex flex-col gap-1'>
                        <div className='flex items-center justify-between gap-4'>
                          <span className='text-muted-foreground'>{t('dashboard.metrics.sales')}:</span>
                          <span className='font-medium text-foreground'>{formatPkrFull(data.sales)}</span>
                        </div>
                        <div className='flex items-center justify-between gap-4'>
                          <span className='text-muted-foreground'>{t('dashboard.metrics.netProfit')}:</span>
                          <span className='font-medium text-foreground'>{formatPkrFull(data.netProfit)}</span>
                        </div>
                        <div className='flex items-center justify-between gap-4'>
                          <span className='text-muted-foreground'>{t('dashboard.metrics.units')}:</span>
                          <span className='font-medium text-foreground'>{formatNumber(data.ordersCount)}</span>
                        </div>
                        {compare && data.prevSales !== undefined ? (
                          <div className='flex items-center justify-between gap-4 pt-1 border-t'>
                            <span className='text-muted-foreground'>{t('dashboard.previousPeriod')}:</span>
                            <span className='font-medium text-muted-foreground'>{formatPkrFull(data.prevSales)}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign='top' align='right' height={36} />
              <Bar
                dataKey='sales'
                name={t('dashboard.metrics.sales')}
                fill='var(--color-sales, var(--chart-1))'
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Line
                type='monotone'
                dataKey='netProfit'
                name={t('dashboard.metrics.netProfit')}
                stroke='var(--color-profit, var(--chart-3))'
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              {compare ? (
                <Line
                  type='monotone'
                  dataKey='prevSales'
                  name={t('dashboard.previousPeriod')}
                  stroke='hsl(var(--muted-foreground))'
                  strokeWidth={2}
                  strokeDasharray='4 4'
                  dot={false}
                />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className='lg:col-span-5'>
        <ChartCard
          title={t('dashboard.profitWaterfallTitle')}
          tooltip={t('dashboard.profitWaterfallTooltip')}
          isLoading={isWaterfallLoading}
          error={waterfallError as Error}
          onRetry={refetchWaterfall}
          isEmpty={waterfallSteps.length === 0}
          skeletonType='waterfall'
          tableColumns={waterfallTableColumns}
          tableRows={waterfallTableRows}
          csvFilename='profit-waterfall'
        >
          <ResponsiveContainer width='100%' height={320}>
            <ComposedChart data={waterfallChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-muted/40' />
              <XAxis dataKey='name' className='text-[10px]' tickLine={false} interval={0} />
              <YAxis
                tickFormatter={(val: number) => formatPkrCompact(val)}
                className='text-xs'
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0].payload;
                  return (
                    <div className='rounded-lg border bg-background p-2.5 shadow-md text-xs'>
                      <div className='font-semibold text-foreground'>{data.name}</div>
                      <div className='mt-1 flex items-center justify-between gap-4'>
                        <span className='text-muted-foreground'>{t('dashboard.metrics.amount')}:</span>
                        <span className='font-medium text-foreground'>
                          {formatPkrFull(data.signedAmount)}
                        </span>
                      </div>
                      <div className='flex items-center justify-between gap-4'>
                        <span className='text-muted-foreground'>{t('dashboard.metrics.closingBalance')}:</span>
                        <span className='font-medium text-foreground'>{formatPkrFull(data.runningTotal)}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey='amount' radius={[4, 4, 0, 0]} maxBarSize={45}>
                {waterfallChartData.map((entry, idx) => {
                  const isTotal = idx === waterfallChartData.length - 1;
                  const fill = isTotal
                    ? 'var(--chart-1)'
                    : entry.isNegative
                      ? '#ef4444'
                      : '#10b981';
                  return <Cell key={idx} fill={fill} />;
                })}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
