'use client';

import { OverdraftAlert } from '@/components/common/overdraft-alert';
import { formatPkr } from '@/lib/dukaan/numbers';
import { useT } from '@/i18n/use-t';
import type { ReturnSaleSettlementPreviewProps } from '@/types/sales';

export function ReturnSaleSettlementPreview({
  previewData,
  showOverdraft,
  shortfallAmount,
  confirmOverdraft,
  onConfirmOverdraftChange
}: ReturnSaleSettlementPreviewProps) {
  const t = useT();

  return (
    <>
      {previewData ? (
        <div className='space-y-2 rounded-lg border bg-muted/40 p-3 text-xs'>
          <p className='font-semibold text-foreground'>
            {t('sales.returnDialog.settlementPreview')}
          </p>
          <div className='grid grid-cols-2 gap-2'>
            <div>
              <span className='text-muted-foreground'>{t('sales.returnDialog.returnValue')} </span>
              <span className='font-medium'>{formatPkr(previewData.returnAmount)}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>
                {t('sales.returnDialog.maxRefundableCash')}{' '}
              </span>
              <span className='font-medium text-emerald-600 dark:text-emerald-400'>
                {formatPkr(previewData.refundable)}
              </span>
            </div>
            <div>
              <span className='text-muted-foreground'>{t('sales.returnDialog.udharRelief')} </span>
              <span className='font-medium'>
                {formatPkr(previewData.outstandingBefore - previewData.outstandingAfter)}
              </span>
            </div>
            <div>
              <span className='text-muted-foreground'>
                {t('sales.returnDialog.outstandingAfter')}{' '}
              </span>
              <span className='font-medium'>{formatPkr(previewData.outstandingAfter)}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>
                {t('sales.returnDialog.drawerCashAfter')}{' '}
              </span>
              <span className='font-medium'>{formatPkr(previewData.cashAfter)}</span>
            </div>
          </div>

          {showOverdraft ? (
            <OverdraftAlert
              variant='compact'
              checked={confirmOverdraft}
              onCheckedChange={onConfirmOverdraftChange}
              description={t('sales.returnDialog.overdraftNotice', {
                shortfall: shortfallAmount
              })}
              id='return-overdraft'
              className='mt-2'
            />
          ) : null}
        </div>
      ) : null}

      {showOverdraft && !previewData ? (
        <OverdraftAlert
          variant='compact'
          checked={confirmOverdraft}
          onCheckedChange={onConfirmOverdraftChange}
          description={t('sales.returnDialog.overdraftNotice', {
            shortfall: shortfallAmount
          })}
          id='return-overdraft-fallback'
        />
      ) : null}
    </>
  );
}
