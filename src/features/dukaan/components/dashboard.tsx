'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DateRangeFilter } from '@/components/dashboard/date-range-filter';
import { ChartSkeleton } from '@/components/dashboard/chart-skeleton';
import { DashboardTrialBanner } from './dashboard-trial-banner';
import { DashboardKpisRow } from './dashboard-kpis';
import { DashboardRow2SalesProfit } from './dashboard-row2-sales-profit';
import { DashboardRow3CashUdhar } from './dashboard-row3-cash-udhar';
import { DashboardRow4ProductsMix } from './dashboard-row4-products-mix';
import { DashboardRow5ExpensesInventory } from './dashboard-row5-expenses-inventory';
import { useInView } from '@/hooks/use-in-view';
import { useT } from '@/i18n/use-t';
import { cn } from '@/lib/utils';
import type { DashboardPeriod, LazyChartSectionProps } from '@/types/charts';
import type { DashboardRangeParams } from '@/types/dashboard';

function LazySection({ children, minHeight = 320, skeletonType = 'bar' }: LazyChartSectionProps) {
  const { ref, inView } = useInView<HTMLDivElement>('240px');
  return (
    <div
      ref={ref}
      className={cn(!inView && 'min-h-[320px]', !inView && minHeight >= 360 && 'min-h-[360px]')}
    >
      {inView ? children : <ChartSkeleton type={skeletonType} height={minHeight} />}
    </div>
  );
}

export function DukaanDashboard() {
  const t = useT();
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const shopName = session?.user?.shopName ?? '';

  const period = (searchParams.get('period') as DashboardPeriod) || '7d';
  const compareParam = searchParams.get('compare');
  const compare =
    compareParam !== null ? compareParam === 'true' : period !== 'today' && period !== 'yesterday';

  const params: DashboardRangeParams = useMemo(
    () => ({
      period,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      compare
    }),
    [period, compare, searchParams]
  );

  return (
    <div className='flex flex-1 flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>{t('pages.dashboard.title')}</h1>
          <p className='text-muted-foreground text-sm'>
            {shopName
              ? t('dashboard.snapshot', { shop: shopName })
              : t('pages.dashboard.description')}
          </p>
        </div>
        <DateRangeFilter currentPeriod={period} compare={compare} />
      </div>

      <DashboardTrialBanner />

      <DashboardKpisRow params={params} />
      <DashboardRow2SalesProfit params={params} compare={compare} />
      <LazySection minHeight={320} skeletonType='row-cash-udhar'>
        <DashboardRow3CashUdhar params={params} />
      </LazySection>
      <LazySection minHeight={320} skeletonType='row-products-mix'>
        <DashboardRow4ProductsMix params={params} />
      </LazySection>
      <LazySection minHeight={360} skeletonType='row-expenses-attention'>
        <DashboardRow5ExpensesInventory params={params} />
      </LazySection>
    </div>
  );
}
