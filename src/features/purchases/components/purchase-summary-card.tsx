'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/i18n/use-t';
import { formatPkr, toPaisa } from '@/lib/dukaan/numbers';
import type { PurchaseSummaryCardProps } from '@/types/purchases';
import {
  calcPurchaseDueRs,
  calcPurchaseLineTotalRs
} from '../helpers/purchase-create-helpers';

export function PurchaseSummaryCard({
  isOpeningStock,
  lines,
  paidNow,
  paidNowField,
  warning,
  saving,
  onConfirmOverdraft,
  onCancel
}: PurchaseSummaryCardProps) {
  const t = useT();
  const totalRs = calcPurchaseLineTotalRs(lines);
  const dueRs = calcPurchaseDueRs(totalRs, paidNow);

  return (
    <Card className='shadow-sm'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base'>{t('dukaan.purchase.totalLabel')}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='bg-muted/40 rounded-lg px-3.5 py-3'>
          <div className='flex items-baseline justify-between gap-3'>
            <span className='text-muted-foreground text-xs font-medium sm:text-sm'>
              {t('dukaan.purchase.totalLabel')}
            </span>
            <span className='text-xl font-bold tracking-tight tabular-nums sm:text-2xl'>
              {formatPkr(toPaisa(totalRs))}
            </span>
          </div>
        </div>

        {isOpeningStock ? (
          <p className='text-muted-foreground text-xs'>
            {t('dukaan.purchase.noCashMovement')}
          </p>
        ) : (
          <div className='space-y-3'>
            {paidNowField}
            <div className='bg-muted/20 flex items-baseline justify-between gap-3 rounded-lg border px-3 py-2.5'>
              <span className='text-muted-foreground text-xs font-medium'>
                {dueRs > 0
                  ? t('dukaan.purchase.supplierPayable')
                  : t('dukaan.purchase.balanceDue')}
              </span>
              <span
                className={
                  dueRs > 0
                    ? 'text-base font-semibold tabular-nums text-amber-700 dark:text-amber-400'
                    : 'text-foreground text-base font-semibold tabular-nums'
                }
              >
                {formatPkr(toPaisa(dueRs))}
              </span>
            </div>
          </div>
        )}

        {warning ? (
          <div className='rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm'>
            <p className='font-medium text-amber-900 dark:text-amber-200'>
              {warning.message || t('purchases.overdraftWarning')}
            </p>
            {warning.shortfall ? (
              <p className='text-muted-foreground mt-1 text-xs'>
                {t('purchases.shortfall')} {formatPkr(warning.shortfall)}
              </p>
            ) : null}
            <Button
              type='button'
              variant='destructive'
              size='sm'
              className='mt-3 w-full'
              disabled={saving}
              onClick={onConfirmOverdraft}
            >
              {t('common.confirm')}
            </Button>
          </div>
        ) : null}

        <div className='space-y-2 pt-1'>
          <Button type='submit' className='w-full' disabled={saving} isLoading={saving}>
            <Icons.check className='me-2 size-4' />
            {t('common.save')}
          </Button>
          <Button
            type='button'
            variant='outline'
            className='w-full'
            disabled={saving}
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
