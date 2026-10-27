'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ChartCard } from '@/components/dashboard/chart-card';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/dashboard/formatters';
import { useT } from '@/i18n/use-t';
import {
  platformActivityQueryOptions,
  platformCitiesQueryOptions
} from '../api/queries';

export function PlatformDashboardCitiesActivity() {
  const t = useT();
  const [activityDays, setActivityDays] = useState<30 | 90>(30);
  const citiesQuery = useQuery(platformCitiesQueryOptions(10));
  const activityQuery = useQuery(platformActivityQueryOptions(activityDays));
  const cities = citiesQuery.data;
  const activity = activityQuery.data;

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
      <ChartCard
        title={t('platform.shopsByCity')}
        isLoading={citiesQuery.isLoading}
        error={citiesQuery.error}
        onRetry={() => void citiesQuery.refetch()}
        isEmpty={!cities?.buckets?.length}
        skeletonType='list'
        height={300}
        tableColumns={[
          { key: 'city', label: t('platform.city') },
          { key: 'shopCount', label: t('platform.count') }
        ]}
        tableRows={(cities?.buckets ?? []).map((b) => ({
          city: b.city,
          shopCount: b.shopCount
        }))}
        csvFilename='platform-cities'
      >
        <div className='max-h-[260px] space-y-2 overflow-y-auto'>
          {(cities?.buckets ?? []).map((bucket) => (
            <div key={bucket.city} className='flex items-center justify-between text-sm'>
              <span className='truncate'>{bucket.city}</span>
              <Badge variant='secondary' className='tabular-nums'>
                {formatNumber(bucket.shopCount)}
              </Badge>
            </div>
          ))}
        </div>
      </ChartCard>

      <div className='lg:col-span-2'>
        <ChartCard
          title={t('platform.activity')}
          isLoading={activityQuery.isLoading}
          error={activityQuery.error}
          onRetry={() => void activityQuery.refetch()}
          isEmpty={!activity?.series?.length}
          skeletonType='line'
          height={300}
          metrics={[
            { key: '30', label: t('platform.activity30d') },
            { key: '90', label: t('platform.activity90d') }
          ]}
          selectedMetric={String(activityDays)}
          onSelectMetric={(key) => setActivityDays(key === '90' ? 90 : 30)}
          tableColumns={[
            { key: 'date', label: t('platform.date') },
            { key: 'salesCount', label: t('platform.salesCount') },
            { key: 'activeShops', label: t('platform.activeShops') }
          ]}
          tableRows={(activity?.series ?? []).map((row) => ({
            date: row.date,
            salesCount: row.salesCount,
            activeShops: row.activeShops
          }))}
          csvFilename='platform-activity'
        >
          <ResponsiveContainer width='100%' height='100%'>
            <ComposedChart data={activity?.series ?? []}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
              <XAxis dataKey='date' tick={{ fontSize: 10 }} minTickGap={24} />
              <YAxis
                yAxisId='sales'
                tick={{ fontSize: 11 }}
                allowDecimals={false}
                width={48}
              />
              <YAxis
                yAxisId='shops'
                orientation='right'
                tick={{ fontSize: 11 }}
                allowDecimals={false}
                width={40}
              />
              <Tooltip />
              <Line
                yAxisId='sales'
                type='monotone'
                dataKey='salesCount'
                stroke='var(--chart-1)'
                strokeWidth={2}
                dot={false}
                name={t('platform.salesCount')}
              />
              <Line
                yAxisId='shops'
                type='monotone'
                dataKey='activeShops'
                stroke='var(--chart-5)'
                strokeWidth={2}
                dot={false}
                name={t('platform.activeShops')}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
