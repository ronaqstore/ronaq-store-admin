'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { IconBrandWhatsapp, IconCopy, IconExternalLink } from '@tabler/icons-react';
import { ChartCard } from '@/components/dashboard/chart-card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { whatsappReminderUrl } from '@/constants/api';
import { useT } from '@/i18n/use-t';
import { cn } from '@/lib/utils';
import { platformRenewalsQueryOptions } from '../api/queries';

function copyPhone(phone: string) {
  void navigator.clipboard?.writeText(phone);
}

function openWhatsApp(phone: string, text: string) {
  window.open(whatsappReminderUrl(phone, text), '_blank', 'noopener,noreferrer');
}

export function PlatformDashboardRenewals() {
  const t = useT();
  const renewalsQuery = useQuery(platformRenewalsQueryOptions(8));
  const renewals = renewalsQuery.data;

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
      <ChartCard
        title={t('platform.renewalPipeline')}
        isLoading={renewalsQuery.isLoading}
        error={renewalsQuery.error}
        onRetry={() => void renewalsQuery.refetch()}
        isEmpty={!renewals?.series?.length}
        skeletonType='bar'
        height={300}
        tableColumns={[
          { key: 'weekStart', label: t('platform.week') },
          { key: 'expiringCount', label: t('platform.expiring') }
        ]}
        tableRows={(renewals?.series ?? []).map((row) => ({
          weekStart: row.weekStart,
          expiringCount: row.expiringCount
        }))}
        csvFilename='platform-renewals'
      >
        <ResponsiveContainer width='100%' height='100%'>
          <ComposedChart data={renewals?.series ?? []}>
            <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
            <XAxis dataKey='weekStart' tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar
              dataKey='expiringCount'
              fill='var(--chart-4)'
              name={t('platform.expiring')}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={t('platform.nextExpiring')}
        isLoading={renewalsQuery.isLoading}
        error={renewalsQuery.error}
        onRetry={() => void renewalsQuery.refetch()}
        isEmpty={!renewals?.nextExpiring?.length}
        skeletonType='list'
        height={300}
      >
        <div className='max-h-[260px] space-y-2 overflow-y-auto pe-1'>
          {(renewals?.nextExpiring ?? []).map((shop) => {
            const phone = shop.ownerPhone;
            return (
              <div
                key={shop.id}
                className='flex items-start justify-between gap-2 rounded-md border p-2 text-sm'
              >
                <div className='min-w-0'>
                  <p className='truncate font-medium'>{shop.name}</p>
                  <p className='text-muted-foreground text-xs'>
                    {shop.city || t('platform.unknownCity')} ·{' '}
                    {new Date(shop.endsAt).toLocaleDateString()}
                  </p>
                  <p className='text-muted-foreground text-xs tabular-nums'>
                    {phone || '—'}
                  </p>
                </div>
                <div className='flex shrink-0 gap-1'>
                  {phone ? (
                    <>
                      <Button
                        type='button'
                        size='icon'
                        variant='ghost'
                        className='h-8 w-8'
                        onClick={() => copyPhone(phone)}
                        aria-label={t('platform.copyPhone')}
                      >
                        <IconCopy className='h-4 w-4' />
                      </Button>
                      <Button
                        type='button'
                        size='icon'
                        variant='ghost'
                        className='h-8 w-8'
                        onClick={() =>
                          openWhatsApp(
                            phone,
                            t('platform.renewalWhatsappMessage', { shop: shop.name })
                          )
                        }
                        aria-label={t('platform.whatsapp')}
                      >
                        <IconBrandWhatsapp className='h-4 w-4' />
                      </Button>
                    </>
                  ) : null}
                  <Link
                    href='/dashboard/platform/shops'
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}
                    aria-label={t('platform.viewShop')}
                  >
                    <IconExternalLink className='h-4 w-4' />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}
