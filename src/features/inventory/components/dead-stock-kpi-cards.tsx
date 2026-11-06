'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { calculateDeadStockMetrics, getAgingBucketMeta } from '../helpers/dead-stock-helpers';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPkr } from '@/lib/money';
import type { DeadStockAgingBucket, DeadStockBucketItemDto } from '@/lib/api/types';
import type { DeadStockKpiCardsProps } from '@/types/inventory';

const BUCKET_ITEMS = [
  { bucket: '0-15' as const, labelKey: 'buckets.b015' as const },
  { bucket: '16-30' as const, labelKey: 'buckets.b1630' as const },
  { bucket: '31-60' as const, labelKey: 'buckets.b3160' as const },
  { bucket: '60+' as const, labelKey: 'buckets.b60plus' as const }
] as const;

export function DeadStockKpiCards({
  summary,
  activeBucket,
  isLoading,
  onBucketToggle,
  onSelectDeadStock
}: DeadStockKpiCardsProps) {
  const t = useTranslations('deadStock');
  const metrics = React.useMemo(() => calculateDeadStockMetrics(summary), [summary]);

  const handleCardClick = (bucket: DeadStockAgingBucket) => {
    onBucketToggle(bucket);
  };

  return (
    <div className='flex flex-col gap-4'>
      {metrics.deadStockCount > 0 && (
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/40 p-4 text-rose-950 dark:text-rose-100 shadow-xs'>
          <div className='flex items-start gap-3'>
            <div className='rounded-full bg-rose-100 dark:bg-rose-900/60 p-2 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5'>
              <Icons.warning className='h-5 w-5' />
            </div>
            <div>
              <p className='font-semibold text-sm'>
                {t('kpi.deadStockAlertTitle', { count: metrics.deadStockCount })}
              </p>
              <p className='text-xs text-rose-800 dark:text-rose-300 mt-0.5'>
                {t('kpi.deadStockAlertDesc', {
                  count: metrics.deadStockCount,
                  value: formatPkr(metrics.deadStockCostValue)
                })}
              </p>
            </div>
          </div>
          {activeBucket !== '60+' && (
            <Button
              type='button'
              size='sm'
              variant='destructive'
              className='shrink-0'
              onClick={onSelectDeadStock}
            >
              {t('kpi.filterDeadStockButton')}
            </Button>
          )}
        </div>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {BUCKET_ITEMS.map((item) => {
          const bucketData = summary?.buckets.find(
            (b: DeadStockBucketItemDto) => b.bucket === item.bucket
          );
          const meta = getAgingBucketMeta(item.bucket);
          const isSelected = activeBucket === item.bucket;
          const count = bucketData?.count ?? 0;
          const costValue = bucketData?.costValue ?? 0;

          return (
            <Card
              key={item.bucket}
              onClick={() => handleCardClick(item.bucket)}
              className={`cursor-pointer transition-all duration-200 border-2 select-none hover:shadow-md ${
                isSelected
                  ? 'ring-2 ring-primary border-primary bg-accent/40 shadow-sm'
                  : `${meta.borderClass} hover:border-primary/50`
              }`}
            >
              <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
                <CardTitle className='text-sm font-semibold tracking-tight'>
                  {t(item.labelKey)}
                </CardTitle>
                <Badge
                  variant={meta.badgeVariant}
                  className='text-[10px] uppercase font-bold tracking-wider'
                >
                  {meta.badgeLabel}
                </Badge>
              </CardHeader>
              <CardContent className='pt-1'>
                {isLoading ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-7 w-20' />
                    <Skeleton className='h-4 w-28' />
                  </div>
                ) : (
                  <>
                    <div className='flex items-baseline justify-between'>
                      <div className='text-2xl font-bold tracking-tight'>
                        {count}{' '}
                        <span className='text-xs font-normal text-muted-foreground'>
                          {t('buckets.units')}
                        </span>
                      </div>
                      {isSelected && (
                        <span className='text-[11px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded'>
                          {t('buckets.activeFilter')}
                        </span>
                      )}
                    </div>
                    <div className='mt-2 flex items-center justify-between text-xs text-muted-foreground'>
                      <span>{t('buckets.capitalLocked')}:</span>
                      <span className='font-semibold text-foreground'>{formatPkr(costValue)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card border rounded-lg p-3 text-sm'>
        <div>
          <span className='text-xs text-muted-foreground block'>{t('kpi.totalInStock')}</span>
          <span className='font-bold text-base'>{summary?.totalInStockUnits ?? 0}</span>
        </div>
        <div>
          <span className='text-xs text-muted-foreground block'>{t('kpi.totalValue')}</span>
          <span className='font-bold text-base'>{formatPkr(summary?.totalStockValue ?? 0)}</span>
        </div>
        <div>
          <span className='text-xs text-muted-foreground block'>{t('kpi.avgDays')}</span>
          <span className='font-bold text-base'>
            {metrics.averageDaysOnShelf} {t('kpi.daysUnit')}
          </span>
        </div>
        <div>
          <span className='text-xs text-muted-foreground block'>{t('kpi.deadStockRatio')}</span>
          <span
            className={`font-bold text-base ${
              metrics.isHighRisk ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'
            }`}
          >
            {metrics.deadStockCountPercent}% ({metrics.deadStockCount} {t('buckets.units')})
          </span>
        </div>
      </div>
    </div>
  );
}
