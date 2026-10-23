'use client';

import { useTranslations } from 'next-intl';
import { formatPkr } from '@/lib/dukaan/numbers';
import { Card, CardContent } from '@/components/ui/card';
import type { SerializedUnitsKpiCardsProps } from '@/types/inventory';

export function SerializedUnitsKpiCards({
  totalCount,
  inStockCount,
  soldCount,
  damagedCount,
  totalStockValue,
  avgUnitCost
}: SerializedUnitsKpiCardsProps) {
  const t = useTranslations('inventory');

  return (
    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3'>
      <Card className='shadow-none border-border/70 bg-card/60'>
        <CardContent className='p-3.5 space-y-1'>
          <p className='text-xs font-medium text-muted-foreground'>{t('totalUnits')}</p>
          <p className='text-2xl font-bold tabular-nums text-foreground'>{totalCount}</p>
        </CardContent>
      </Card>

      <Card className='shadow-none border-emerald-500/30 bg-emerald-500/[0.04]'>
        <CardContent className='p-3.5 space-y-1'>
          <p className='text-xs font-medium text-emerald-600 dark:text-emerald-400'>
            {t('inStockUnits')}
          </p>
          <p className='text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400'>
            {inStockCount}
          </p>
        </CardContent>
      </Card>

      <Card className='shadow-none border-blue-500/30 bg-blue-500/[0.04]'>
        <CardContent className='p-3.5 space-y-1'>
          <p className='text-xs font-medium text-blue-600 dark:text-blue-400'>{t('soldUnits')}</p>
          <p className='text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400'>
            {soldCount}
          </p>
        </CardContent>
      </Card>

      <Card className='shadow-none border-rose-500/30 bg-rose-500/[0.04]'>
        <CardContent className='p-3.5 space-y-1'>
          <p className='text-xs font-medium text-rose-600 dark:text-rose-400'>
            {t('damagedUnits')}
          </p>
          <p className='text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400'>
            {damagedCount}
          </p>
        </CardContent>
      </Card>

      <Card className='shadow-none border-border/70 bg-card/60'>
        <CardContent className='p-3.5 space-y-1'>
          <p className='text-xs font-medium text-muted-foreground'>{t('stockValue')}</p>
          <p className='text-lg font-bold tabular-nums text-foreground truncate'>
            {formatPkr(totalStockValue)}
          </p>
        </CardContent>
      </Card>

      <Card className='shadow-none border-border/70 bg-card/60'>
        <CardContent className='p-3.5 space-y-1'>
          <p className='text-xs font-medium text-muted-foreground'>{t('avgCost')}</p>
          <p className='text-lg font-bold tabular-nums text-foreground truncate'>
            {formatPkr(avgUnitCost)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
