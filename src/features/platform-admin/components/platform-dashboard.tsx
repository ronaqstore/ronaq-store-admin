'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ChartCard } from '@/components/dashboard/chart-card';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { ChartSkeleton } from '@/components/dashboard/chart-skeleton';
import { formatNumber } from '@/lib/dashboard/formatters';
import { useT } from '@/i18n/use-t';
import {
  platformDashboardKpisQueryOptions,
  platformFunnelQueryOptions,
  platformShopGrowthQueryOptions
} from '../api/queries';
import { PlatformDashboardAtRisk } from './platform-dashboard-at-risk';
import { PlatformDashboardCitiesActivity } from './platform-dashboard-cities-activity';
import { PlatformDashboardRenewals } from './platform-dashboard-renewals';
import { PlatformLazyBlock } from './platform-lazy-block';

export function PlatformDashboard() {
  const t = useT();

  const kpisQuery = useQuery(platformDashboardKpisQueryOptions());
  const growthQuery = useQuery(platformShopGrowthQueryOptions(12));
  const funnelQuery = useQuery(platformFunnelQueryOptions());

  const kpis = kpisQuery.data;
  const growth = growthQuery.data;
  const funnel = funnelQuery.data;

  const funnelChart = useMemo(
    () =>
      (funnel?.stages ?? []).map((stage) => ({
        name: stage.label,
        count: stage.count,
        dropOffPct: stage.dropOffPct
      })),
    [funnel]
  );

  return (
    <div className='flex flex-1 flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>{t('platform.platformOverview')}</h1>
        <p className='text-muted-foreground text-sm'>
          {t('platform.platformOverviewDescription')}
        </p>
      </div>

      {kpisQuery.isLoading || !kpis ? (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className='rounded-lg border bg-card p-4'>
              <ChartSkeleton type='kpi' />
            </div>
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <KpiCard
            label={t('platform.totalShops')}
            value={formatNumber(kpis.totalShops)}
            href='/dashboard/platform/shops'
          />
          <KpiCard
            label={t('status.active')}
            value={formatNumber(kpis.activeShops)}
            href='/dashboard/platform/shops?accessStatus=ACTIVE'
          />
          <KpiCard
            label={t('status.expired')}
            value={formatNumber(kpis.expiredShops)}
            href='/dashboard/platform/shops?accessStatus=EXPIRED'
          />
          <KpiCard
            label={t('status.suspended')}
            value={formatNumber(kpis.suspendedShops)}
            href='/dashboard/platform/shops?accessStatus=SUSPENDED'
          />
          <KpiCard label={t('platform.newThisMonth')} value={formatNumber(kpis.newThisMonth)} />
          <KpiCard
            label={t('platform.expiringIn7Days')}
            value={formatNumber(kpis.expiringIn7Days)}
          />
          <KpiCard
            label={t('platform.shopsWithSaleLast7Days')}
            value={formatNumber(kpis.shopsWithSaleLast7Days)}
          />
          <KpiCard
            label={t('platform.onlineStoreEnabled')}
            value={`${formatNumber(kpis.onlineStoreEnabledCount)} (${kpis.onlineStoreEnabledPercent}%)`}
          />
        </div>
      )}

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <ChartCard
            title={t('platform.shopGrowth')}
            isLoading={growthQuery.isLoading}
            error={growthQuery.error}
            onRetry={() => void growthQuery.refetch()}
            isEmpty={!growth?.series?.length}
            skeletonType='composed'
            height={320}
            tableColumns={[
              { key: 'month', label: t('platform.month') },
              { key: 'newShops', label: t('platform.newShops') },
              { key: 'cumulative', label: t('platform.cumulative') }
            ]}
            tableRows={(growth?.series ?? []).map((row) => ({
              month: row.month,
              newShops: row.newShops,
              cumulative: row.cumulative
            }))}
            csvFilename='platform-shop-growth'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <ComposedChart data={growth?.series ?? []}>
                <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                <XAxis dataKey='month' tick={{ fontSize: 11 }} />
                <YAxis yAxisId='left' tick={{ fontSize: 11 }} />
                <YAxis yAxisId='right' orientation='right' tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  yAxisId='left'
                  dataKey='newShops'
                  fill='var(--chart-1)'
                  name={t('platform.newShops')}
                />
                <Line
                  yAxisId='right'
                  type='monotone'
                  dataKey='cumulative'
                  stroke='var(--chart-2)'
                  strokeWidth={2}
                  dot={false}
                  name={t('platform.cumulative')}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <ChartCard
          title={t('platform.onboardingFunnel')}
          isLoading={funnelQuery.isLoading}
          error={funnelQuery.error}
          onRetry={() => void funnelQuery.refetch()}
          isEmpty={!funnelChart.length}
          skeletonType='funnel'
          height={320}
          tableColumns={[
            { key: 'name', label: t('platform.stage') },
            { key: 'count', label: t('platform.count') },
            { key: 'dropOffPct', label: t('platform.dropOff') }
          ]}
          tableRows={funnelChart}
          csvFilename='platform-funnel'
        >
          <div className='flex h-full flex-col justify-center gap-3 px-1'>
            {funnelChart.map((stage) => {
              const max = funnelChart[0]?.count || 1;
              const width = Math.max(8, Math.round((stage.count / max) * 100));
              return (
                <div key={stage.name} className='space-y-1'>
                  <div className='flex items-center justify-between gap-2 text-xs'>
                    <span className='truncate'>{stage.name}</span>
                    <span className='tabular-nums'>
                      {formatNumber(stage.count)}
                      {stage.dropOffPct > 0 ? ` (−${stage.dropOffPct}%)` : ''}
                    </span>
                  </div>
                  <div className='bg-muted h-2.5 w-full overflow-hidden rounded-full'>
                    <div
                      className='bg-[var(--chart-3)] h-full rounded-full'
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      <PlatformLazyBlock skeletonType='row-platform-renewals'>
        <PlatformDashboardRenewals />
      </PlatformLazyBlock>

      <PlatformLazyBlock skeletonType='row-platform-activity'>
        <PlatformDashboardCitiesActivity />
      </PlatformLazyBlock>

      <PlatformLazyBlock minHeight={360} skeletonType='row-platform-risk'>
        <PlatformDashboardAtRisk />
      </PlatformLazyBlock>
    </div>
  );
}
