'use client';

import { useT } from '@/i18n/use-t';
import { formatPkr, toPaisa } from '@/lib/dukaan/numbers';
import type { SaleTotalsSummaryProps } from '@/types/sales';

export function SaleTotalsSummary({
  subtotalRs,
  totalRs,
  udharRs
}: SaleTotalsSummaryProps) {
  const t = useT();

  return (
    <p className='flex items-center text-muted-foreground text-sm sm:col-span-2'>
      {t('common.subtotal')}: {formatPkr(toPaisa(subtotalRs))} · {t('common.total')}:{' '}
      {formatPkr(toPaisa(totalRs))}
      {udharRs > 0 &&
        ` · ${t('dukaan.sale.outstandingUdhar')}: ${formatPkr(toPaisa(udharRs))}`}
    </p>
  );
}
