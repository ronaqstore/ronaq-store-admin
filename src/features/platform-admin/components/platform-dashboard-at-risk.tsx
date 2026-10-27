'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import { ChartCard } from '@/components/dashboard/chart-card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { whatsappReminderUrl } from '@/constants/api';
import { formatNumber } from '@/lib/dashboard/formatters';
import { useT } from '@/i18n/use-t';
import { platformAtRiskQueryOptions } from '../api/queries';

const AT_RISK_PAGE_SIZE = 20;

function openWhatsApp(phone: string, text: string) {
  window.open(whatsappReminderUrl(phone, text), '_blank', 'noopener,noreferrer');
}

export function PlatformDashboardAtRisk() {
  const t = useT();
  const [page, setPage] = useState(1);
  const atRiskQuery = useQuery(platformAtRiskQueryOptions(page, AT_RISK_PAGE_SIZE));
  const atRisk = atRiskQuery.data;

  return (
    <ChartCard
      title={t('platform.atRiskShops')}
      description={t('platform.atRiskDescription')}
      isLoading={atRiskQuery.isLoading}
      error={atRiskQuery.error}
      onRetry={() => void atRiskQuery.refetch()}
      isEmpty={!atRisk?.items?.length}
      skeletonType='table'
      height={360}
    >
      <div className='flex h-full min-h-0 flex-col gap-3'>
        <div className='min-h-0 flex-1 overflow-auto rounded-md border'>
          <Table>
            <TableHeader className='bg-card sticky top-0 z-10'>
              <TableRow>
                <TableHead>{t('platform.shop')}</TableHead>
                <TableHead>{t('platform.city')}</TableHead>
                <TableHead>{t('platform.lastSale')}</TableHead>
                <TableHead>{t('platform.endsAt')}</TableHead>
                <TableHead className='text-end'>{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(atRisk?.items ?? []).map((shop) => {
                const phone = shop.ownerPhone;
                return (
                  <TableRow key={shop.id}>
                    <TableCell className='font-medium'>{shop.name}</TableCell>
                    <TableCell>{shop.city || t('platform.unknownCity')}</TableCell>
                    <TableCell>
                      {shop.lastSaleAt
                        ? new Date(shop.lastSaleAt).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {new Date(shop.subscriptionEndsAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className='text-end'>
                      {phone ? (
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            openWhatsApp(
                              phone,
                              t('platform.atRiskWhatsappMessage', { shop: shop.name })
                            )
                          }
                          aria-label={t('platform.whatsapp')}
                        >
                          <IconBrandWhatsapp className='me-1 h-4 w-4' />
                          {t('platform.whatsapp')}
                        </Button>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className='flex shrink-0 items-center justify-between'>
          <p className='text-muted-foreground text-xs'>
            {t('platform.showingPage', {
              page: atRisk?.page ?? page,
              total: formatNumber(atRisk?.total ?? 0)
            })}
          </p>
          <div className='flex gap-2'>
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t('table.prev')}
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={!atRisk || page * atRisk.pageSize >= atRisk.total}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('table.next')}
            </Button>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
