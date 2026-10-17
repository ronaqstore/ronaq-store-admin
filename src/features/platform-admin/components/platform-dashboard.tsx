'use client';

import { Link } from '@/i18n/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { platformOverviewQueryOptions } from '../api/queries';
import { useT } from '@/i18n/use-t';

const KPI_LINKS = [
  {
    key: 'totalShops',
    labelKey: 'platform.totalShops',
    href: '/dashboard/platform/shops'
  },
  {
    key: 'activeShops',
    labelKey: 'status.active',
    href: '/dashboard/platform/shops?accessStatus=ACTIVE'
  },
  {
    key: 'expiredShops',
    labelKey: 'status.expired',
    href: '/dashboard/platform/shops?accessStatus=EXPIRED'
  },
  {
    key: 'suspendedShops',
    labelKey: 'status.suspended',
    href: '/dashboard/platform/shops?accessStatus=SUSPENDED'
  }
] as const;

export function PlatformDashboard() {
  const { data } = useSuspenseQuery(platformOverviewQueryOptions());
  const t = useT();

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>{t('platform.platformOverview')}</h2>
        <p className='text-muted-foreground text-sm'>{t('platform.platformOverviewDescription')}</p>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {KPI_LINKS.map((item) => (
          <Link key={item.key} href={item.href} className='block'>
            <Card className='hover:bg-muted/40 transition-colors'>
              <CardHeader className='pb-2'>
                <CardDescription>{t(item.labelKey)}</CardDescription>
                <CardTitle className='text-2xl tabular-nums'>{String(data[item.key])}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
