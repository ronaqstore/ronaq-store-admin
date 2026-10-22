'use client';

import { Link } from '@/i18n/navigation';
import { useT } from '@/i18n/use-t';
import { formatPkr } from '@/lib/dukaan/numbers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { PartyOutstandingBreakdownProps } from '@/types/party';

export function PartyOutstandingBreakdown({
  currentBalance,
  openingRemaining,
  openingLabel,
  bills,
  billKindLabel,
  totalLabel
}: PartyOutstandingBreakdownProps) {
  const t = useT();
  const hasOpening = openingRemaining > 0;
  const hasAnything = hasOpening || bills.length > 0 || currentBalance > 0;

  if (!hasAnything) {
    return null;
  }

  return (
    <section className='space-y-3'>
      <h3 className='text-sm font-semibold tracking-tight sm:text-base'>
        {t('dukaan.party.outstandingTitle')}
      </h3>

      <div className='divide-border divide-y md:hidden'>
        {hasOpening ? (
          <div className='flex items-center justify-between gap-3 py-2.5'>
            <p className='text-sm font-medium'>{openingLabel}</p>
            <p className='shrink-0 text-sm font-semibold tabular-nums'>
              {formatPkr(openingRemaining)}
            </p>
          </div>
        ) : null}
        {bills.map((bill, index) => (
          <div key={`${bill.id}-${index}`} className='flex items-start justify-between gap-3 py-2.5'>
            <div className='min-w-0 space-y-0.5'>
              <p className='text-sm font-medium'>
                {billKindLabel}{' '}
                {bill.href ? (
                  <Link
                    href={bill.href}
                    className='text-primary underline-offset-2 hover:underline'
                  >
                    {bill.reference}
                  </Link>
                ) : (
                  bill.reference
                )}
              </p>
              <p className='text-muted-foreground text-xs'>
                {bill.date.slice(0, 10)}
                {' · '}
                {formatPkr(bill.paidAmount)}/{formatPkr(bill.totalAmount)}
              </p>
            </div>
            <p className='shrink-0 text-sm font-semibold tabular-nums'>
              {formatPkr(bill.remaining)}
            </p>
          </div>
        ))}
        <div className='flex items-center justify-between gap-3 pt-2.5'>
          <span className='text-sm font-semibold'>{totalLabel}</span>
          <span className='text-sm font-semibold tabular-nums'>{formatPkr(currentBalance)}</span>
        </div>
      </div>

      <div className='hidden overflow-x-auto md:block'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead>{t('dukaan.party.entry')}</TableHead>
              <TableHead className='w-[110px]'>{t('dukaan.party.date')}</TableHead>
              <TableHead className='text-end'>
                {t('dukaan.party.outstandingStillDueCol')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasOpening ? (
              <TableRow>
                <TableCell className='font-medium'>{openingLabel}</TableCell>
                <TableCell className='text-muted-foreground whitespace-nowrap'>—</TableCell>
                <TableCell className='text-end font-medium tabular-nums'>
                  {formatPkr(openingRemaining)}
                </TableCell>
              </TableRow>
            ) : null}
            {bills.map((bill, index) => (
              <TableRow key={`${bill.id}-${index}`}>
                <TableCell>
                  <div className='space-y-0.5'>
                    <p className='font-medium'>
                      {billKindLabel}{' '}
                      {bill.href ? (
                        <Link
                          href={bill.href}
                          className='text-primary underline-offset-2 hover:underline'
                        >
                          {bill.reference}
                        </Link>
                      ) : (
                        bill.reference
                      )}
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      {t('dukaan.party.outstandingBillDetail', {
                        total: formatPkr(bill.totalAmount),
                        paid: formatPkr(bill.paidAmount),
                        remaining: formatPkr(bill.remaining)
                      })}
                    </p>
                  </div>
                </TableCell>
                <TableCell className='text-muted-foreground whitespace-nowrap'>
                  {bill.date.slice(0, 10)}
                </TableCell>
                <TableCell className='text-end font-medium tabular-nums'>
                  {formatPkr(bill.remaining)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className='bg-muted/40 hover:bg-muted/40'>
              <TableCell colSpan={2} className='font-semibold'>
                {totalLabel}
              </TableCell>
              <TableCell className='text-end font-semibold tabular-nums'>
                {formatPkr(currentBalance)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
