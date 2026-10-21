'use client';

import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Link } from '@/i18n/navigation';
import { useT } from '@/i18n/use-t';
import { useAppForm } from '@/lib/form';
import { cn } from '@/lib/utils';
import { formatPkr } from '@/lib/dukaan/numbers';
import { formatPartyLedgerLabel } from '@/lib/dukaan/ledger-label';
import { createReceivePaymentSchema } from '@/lib/dukaan/party-payment-schema';
import { PartyOutstandingBreakdown } from '@/components/common/party-outstanding-breakdown';
import type { PartyLedgerRowsProps, PartyLedgerViewProps } from '@/types/party';

function partyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function amountClass(amount: number): string {
  if (amount > 0) return 'text-foreground';
  if (amount < 0) return 'text-muted-foreground';
  return 'text-foreground';
}

function formatSignedAmount(amount: number): string {
  if (amount > 0) return `+${formatPkr(amount)}`;
  if (amount < 0) return `−${formatPkr(Math.abs(amount))}`;
  return formatPkr(0);
}

function LedgerRows({
  openingBalance,
  ledger,
  openingLabel,
  runningLabel
}: PartyLedgerRowsProps) {
  const t = useT();
  const rows = [
    {
      id: 'opening-seed',
      dateLabel: '—',
      entryLabel: openingLabel,
      amount: openingBalance,
      running: openingBalance,
      signed: false
    },
    ...ledger.map((row) => ({
      id: row.id,
      dateLabel: row.date.slice(0, 10),
      entryLabel: formatPartyLedgerLabel(row.type, row.reference, row.status, t),
      amount: row.amount,
      running: row.running_balance,
      signed: true
    }))
  ];

  return (
    <>
      <div className='divide-border divide-y md:hidden'>
        {rows.map((row) => (
          <div key={row.id} className='py-3'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0 space-y-1'>
                <p className='text-sm font-medium leading-snug'>{row.entryLabel}</p>
                <p className='text-muted-foreground text-xs'>{row.dateLabel}</p>
              </div>
              <p
                className={cn(
                  'shrink-0 text-sm font-medium tabular-nums',
                  row.signed ? amountClass(row.amount) : 'text-foreground'
                )}
              >
                {row.signed ? formatSignedAmount(row.amount) : formatPkr(row.amount)}
              </p>
            </div>
            <div className='text-muted-foreground mt-2 flex items-center justify-between gap-2 text-xs'>
              <span>{runningLabel}</span>
              <span className='text-foreground font-medium tabular-nums'>
                {formatPkr(row.running)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className='hidden overflow-x-auto md:block'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead className='w-[120px]'>{t('dukaan.party.date')}</TableHead>
              <TableHead>{t('dukaan.party.entry')}</TableHead>
              <TableHead className='text-end'>{t('dukaan.party.amount')}</TableHead>
              <TableHead className='text-end'>{t('dukaan.party.running')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className='text-muted-foreground whitespace-nowrap'>
                  {row.dateLabel}
                </TableCell>
                <TableCell className='font-medium'>{row.entryLabel}</TableCell>
                <TableCell
                  className={cn(
                    'text-end font-medium tabular-nums',
                    row.signed ? amountClass(row.amount) : undefined
                  )}
                >
                  {row.signed ? formatSignedAmount(row.amount) : formatPkr(row.amount)}
                </TableCell>
                <TableCell className='text-end font-medium tabular-nums'>
                  {formatPkr(row.running)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export function PartyLedgerView({
  name,
  phone,
  address,
  notes,
  openingBalance,
  currentBalance,
  openingBalanceLabel,
  currentBalanceLabel,
  paymentLabel,
  isPaying,
  onPay,
  ledger,
  backHref,
  backLabel,
  outstanding,
  outstandingBillKind
}: PartyLedgerViewProps) {
  const t = useT();
  const hasDue = currentBalance > 0;
  const hasOutstandingParts =
    outstanding.openingRemaining > 0 || outstanding.bills.length > 0;

  const form = useAppForm({
    defaultValues: { amount: undefined as number | undefined },
    validators: { onSubmit: createReceivePaymentSchema(t) },
    onSubmit: async ({ value }) => {
      if (value.amount != null) await onPay(value.amount);
      form.reset();
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  return (
    <div className='w-full min-w-0 space-y-5'>
      <Link
        href={backHref}
        className='text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-sm transition-colors'
      >
        <Icons.chevronLeft className='h-4 w-4 rtl:rotate-180' />
        {backLabel}
      </Link>

      <div className='rounded-xl border bg-card'>
        <div className='flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between'>
          <div className='flex min-w-0 items-start gap-3'>
            <Avatar size='lg' className='mt-0.5'>
              <AvatarFallback className='bg-muted text-foreground font-semibold'>
                {partyInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0 space-y-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <h2 className='truncate text-lg font-semibold tracking-tight sm:text-xl'>
                  {name}
                </h2>
                {!hasDue ? (
                  <Badge variant='secondary'>{t('dukaan.party.ledgerSettled')}</Badge>
                ) : null}
              </div>
              <div className='text-muted-foreground flex flex-col gap-0.5 text-sm sm:flex-row sm:flex-wrap sm:gap-x-3'>
                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className='inline-flex max-w-full items-center gap-1.5 hover:text-foreground'
                  >
                    <Icons.phone className='h-3.5 w-3.5 shrink-0' />
                    <span className='truncate'>{phone}</span>
                  </a>
                ) : null}
                {address ? (
                  <p className='inline-flex items-start gap-1.5'>
                    <Icons.building className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                    <span className='break-words'>{address}</span>
                  </p>
                ) : null}
              </div>
              {notes ? (
                <p className='text-muted-foreground text-sm'>
                  <span className='text-foreground/80 font-medium'>{t('dukaan.party.notes')}: </span>
                  {notes}
                </p>
              ) : null}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4 border-t pt-4 sm:gap-8 lg:border-t-0 lg:pt-0'>
            <div className='space-y-0.5'>
              <p className='text-muted-foreground text-xs'>
                {t('dukaan.party.outstandingOpeningStillDue')}
              </p>
              <p className='text-lg font-semibold tabular-nums tracking-tight sm:text-xl'>
                {formatPkr(outstanding.openingRemaining)}
              </p>
              {openingBalance > 0 ? (
                <p className='text-muted-foreground text-[11px] tabular-nums'>
                  {openingBalanceLabel}: {formatPkr(openingBalance)}
                </p>
              ) : null}
            </div>
            <div className='space-y-0.5'>
              <p className='text-muted-foreground text-xs'>{currentBalanceLabel}</p>
              <p
                className={cn(
                  'text-lg font-semibold tabular-nums tracking-tight sm:text-xl',
                  hasDue ? 'text-primary' : 'text-foreground'
                )}
              >
                {formatPkr(currentBalance)}
              </p>
            </div>
          </div>
        </div>

        {hasDue ? (
          <div className='border-t px-4 py-4 sm:px-5'>
            <form
              className='flex max-w-md flex-col gap-3 sm:flex-row sm:items-start'
              onSubmit={handleSubmit}
            >
              <div className='min-w-0 flex-1'>
                <form.AppField
                  name='amount'
                  children={(field) => (
                    <field.TextField
                      label={t('dukaan.party.amount')}
                      type='number'
                      min={1}
                      required
                      inputMode='decimal'
                      placeholder={t('common.amountPlaceholder')}
                    />
                  )}
                />
              </div>
              <Button
                type='submit'
                className='w-full shrink-0 sm:mt-6 sm:w-auto'
                isLoading={isPaying}
              >
                {paymentLabel}
              </Button>
            </form>
          </div>
        ) : null}
      </div>

      {hasOutstandingParts ? (
        <div className='rounded-xl border bg-card p-4 sm:p-5'>
          <PartyOutstandingBreakdown
            currentBalance={currentBalance}
            openingRemaining={outstanding.openingRemaining}
            openingLabel={t('dukaan.party.outstandingOpeningStillDue')}
            bills={outstanding.bills}
            billKindLabel={outstandingBillKind}
            totalLabel={t('dukaan.party.outstandingTotal')}
          />
        </div>
      ) : null}

      <div className='rounded-xl border bg-card p-4 sm:p-5'>
        <h3 className='mb-3 text-sm font-semibold tracking-tight sm:text-base'>
          {t('dukaan.party.ledgerHistory')}
        </h3>
        {ledger.length === 0 ? (
          <p className='text-muted-foreground text-sm'>{t('dukaan.party.ledgerHistoryEmpty')}</p>
        ) : (
          <LedgerRows
            openingBalance={openingBalance}
            ledger={ledger}
            openingLabel={t('dukaan.party.ledgerOpeningSeed')}
            runningLabel={t('dukaan.party.running')}
          />
        )}
      </div>
    </div>
  );
}
