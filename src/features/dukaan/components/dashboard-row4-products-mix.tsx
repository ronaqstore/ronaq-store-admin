'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from '@/components/dashboard/chart-card';
import { Badge } from '@/components/ui/badge';
import {
  formatNumber,
  formatPercent,
  formatPkrCompact,
  formatPkrFull,
  truncateChartLabel,
} from '@/lib/dashboard/formatters';
import {
  shopSalesMixQueryOptions,
  shopTopProductsQueryOptions,
} from '../api/queries';
import { useT } from '@/i18n/use-t';
import type { DashboardRow4Props } from '@/types/dashboard';

const DONUT_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'hsl(var(--muted-foreground))',
];

const DONUT_BG_CLASSES = [
  'bg-[var(--chart-1)]',
  'bg-[var(--chart-2)]',
  'bg-[var(--chart-3)]',
  'bg-[var(--chart-4)]',
  'bg-[var(--chart-5)]',
  'bg-muted-foreground',
];

export function DashboardRow4ProductsMix({ params }: DashboardRow4Props) {
  const t = useT();
  const [metric, setMetric] = useState<'revenue' | 'profit' | 'units'>('revenue');

  const {
    data: topProducts,
    isLoading: isProductsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery(shopTopProductsQueryOptions({ ...params, metric, limit: 7 }));

  const {
    data: salesMix,
    isLoading: isMixLoading,
    error: mixError,
    refetch: refetchMix,
  } = useQuery(shopSalesMixQueryOptions(params));

  const productItems = topProducts?.items ?? [];
  const productsChartData = productItems.map((item) => ({
    name: item.name,
    label: truncateChartLabel(item.name, 20),
    brand: item.brand,
    trackingType: item.trackingType,
    value: item.value,
    marginPct: item.marginPct,
    unitsSold: item.unitsSold,
  }));
  const productsChartHeight = Math.max(280, productItems.length * 44);

  const productsTableColumns = [
    { key: 'name', label: t('dashboard.metrics.product') },
    { key: 'trackingType', label: t('dashboard.metrics.trackingType') },
    { key: 'formattedValue', label: t(`dashboard.metrics.${metric}`), align: 'right' as const },
    { key: 'formattedMargin', label: t('dashboard.metrics.margin'), align: 'right' as const },
  ];

  const productsTableRows = productItems.map((item) => ({
    name: `${item.name} (${item.brand})`,
    trackingType: item.trackingType === 'SERIALIZED' ? 'IMEI' : 'QTY',
    formattedValue:
      metric === 'units'
        ? formatNumber(item.value)
        : formatPkrFull(item.value),
    formattedMargin: formatPercent(item.marginPct),
  }));

  const trackingMix = salesMix?.byTrackingType ?? [];
  const categoryMix = salesMix?.byCategory ?? [];

  const mixDonutData = categoryMix.map((c) => ({
    name: c.name,
    value: c.revenue,
    percentage: c.percentage,
  }));

  const mixTableColumns = [
    { key: 'name', label: t('dashboard.metrics.category') },
    { key: 'formattedRevenue', label: t('dashboard.metrics.revenue'), align: 'right' as const },
    { key: 'percentage', label: t('dashboard.metrics.share'), align: 'right' as const },
  ];

  const mixTableRows = categoryMix.map((c) => ({
    name: c.name,
    formattedRevenue: formatPkrFull(c.revenue),
    percentage: `${c.percentage}%`,
  }));

  const metricOptions = [
    { key: 'revenue', label: t('dashboard.metrics.revenue') },
    { key: 'profit', label: t('dashboard.metrics.profit') },
    { key: 'units', label: t('dashboard.metrics.units') },
  ];

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
      <ChartCard
        title={t('dashboard.topProductsTitle')}
        tooltip={t('dashboard.topProductsTooltip')}
        isLoading={isProductsLoading}
        error={productsError as Error}
        onRetry={refetchProducts}
        isEmpty={productItems.length === 0}
        skeletonType='horizontal-bar'
        metrics={metricOptions}
        selectedMetric={metric}
        onSelectMetric={(m) => setMetric(m as 'revenue' | 'profit' | 'units')}
        tableColumns={productsTableColumns}
        tableRows={productsTableRows}
        csvFilename={`top-products-${metric}`}
      >
        <ResponsiveContainer width='100%' height={productsChartHeight}>
          <ComposedChart
            layout='vertical'
            data={productsChartData}
            margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
            barCategoryGap='18%'
          >
            <CartesianGrid strokeDasharray='3 3' horizontal={false} className='stroke-muted/40' />
            <XAxis
              type='number'
              tickFormatter={(val: number) =>
                metric === 'units' ? formatNumber(val) : formatPkrCompact(val)
              }
              className='text-xs'
              tickLine={false}
              axisLine={false}
              tickCount={5}
            />
            <YAxis
              type='category'
              dataKey='label'
              width={128}
              interval={0}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const data = payload[0].payload;
                return (
                  <div className='bg-background max-w-65 rounded-lg border p-2.5 text-xs shadow-md'>
                    <div className='flex flex-col gap-1.5'>
                      <span className='text-foreground wrap-break-word font-semibold'>{data.name}</span>
                      <div className='flex flex-wrap gap-1'>
                        <Badge variant='outline' className='text-[10px]'>
                          {data.brand}
                        </Badge>
                        <Badge variant='secondary' className='text-[10px]'>
                          {data.trackingType === 'SERIALIZED' ? 'IMEI' : 'QTY'}
                        </Badge>
                      </div>
                    </div>
                    <div className='mt-1.5 flex flex-col gap-1'>
                      <div className='flex items-center justify-between gap-4'>
                        <span className='text-muted-foreground'>{t(`dashboard.metrics.${metric}`)}:</span>
                        <span className='font-medium text-foreground'>
                          {metric === 'units' ? formatNumber(data.value) : formatPkrFull(data.value)}
                        </span>
                      </div>
                      <div className='flex items-center justify-between gap-4'>
                        <span className='text-muted-foreground'>{t('dashboard.metrics.margin')}:</span>
                        <span className='font-medium text-emerald-600 dark:text-emerald-400'>
                          {formatPercent(data.marginPct)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey='value'
              fill='var(--chart-2)'
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={t('dashboard.salesMixTitle')}
        tooltip={t('dashboard.salesMixTooltip')}
        isLoading={isMixLoading}
        error={mixError as Error}
        onRetry={refetchMix}
        isEmpty={categoryMix.length === 0}
        skeletonType='donut'
        tableColumns={mixTableColumns}
        tableRows={mixTableRows}
        csvFilename='sales-mix'
      >
        <div className='flex flex-col gap-4'>
          {trackingMix.length > 0 ? (
            <div className='grid grid-cols-2 gap-3 border-b pb-3'>
              {trackingMix.map((track) => (
                <div key={track.trackingType} className='rounded-lg bg-muted/40 p-3'>
                  <div className='text-xs text-muted-foreground font-medium'>{track.label}</div>
                  <div className='mt-1 text-lg font-bold tabular-nums text-foreground'>
                    {formatPkrCompact(track.revenue)}
                  </div>
                  <div className='mt-0.5 text-xs text-muted-foreground'>
                    {track.percentage}% {t('dashboard.metrics.revenue')}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className='flex items-center justify-center gap-4'>
            <ResponsiveContainer width='50%' height={210}>
              <PieChart>
                <Pie
                  data={mixDonutData}
                  cx='50%'
                  cy='50%'
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey='value'
                >
                  {mixDonutData.map((_, idx) => (
                    <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    return (
                      <div className='rounded-lg border bg-background p-2.5 shadow-md text-xs'>
                        <div className='font-semibold text-foreground'>{data.name}</div>
                        <div className='mt-1 flex items-center justify-between gap-4'>
                          <span className='text-muted-foreground'>{t('dashboard.metrics.revenue')}:</span>
                          <span className='font-semibold text-foreground'>{formatPkrFull(data.value)}</span>
                        </div>
                        <div className='flex items-center justify-between gap-4'>
                          <span className='text-muted-foreground'>{t('dashboard.metrics.share')}:</span>
                          <span className='font-medium text-foreground'>{data.percentage}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className='flex flex-col gap-1.5 w-1/2'>
              {categoryMix.slice(0, 5).map((cat, idx) => (
                <div key={cat.categoryId} className='flex items-center justify-between text-xs'>
                  <div className='flex items-center gap-2 truncate'>
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${DONUT_BG_CLASSES[idx % DONUT_BG_CLASSES.length]}`}
                    />
                    <span className='text-muted-foreground truncate'>{cat.name}</span>
                  </div>
                  <span className='font-medium text-foreground tabular-nums shrink-0'>
                    {cat.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
