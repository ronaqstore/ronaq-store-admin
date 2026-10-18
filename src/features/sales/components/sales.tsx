'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import { FloatingActionButton } from '@/components/common/floating-action-button';
import { TablePageBody } from '@/components/layout/table-page-body';
import { Icons } from '@/components/icons';
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
import { useT } from '@/i18n/use-t';
import { formatIsoDate } from '@/lib/dates';
import { formatLabel, formatPkr } from '@/lib/dukaan/numbers';
import dynamic from 'next/dynamic';
import { SalesTable } from './sales-table';
import { SaleCreateDialog } from './sale-create-dialog';
import { saleQueryOptions } from '../api/queries';

const CancelSaleDialog = dynamic(
  () => import('./cancel-sale-dialog').then((mod) => mod.CancelSaleDialog),
  { ssr: false }
);
const ReturnSaleDialog = dynamic(
  () => import('./return-sale-dialog').then((mod) => mod.ReturnSaleDialog),
  { ssr: false }
);
import type {
  SalesHeaderActionProps,
  SalesListClientProps,
  SaleDetailClientProps,
  SaleReceiptClientProps
} from '@/types/sales';

export function SalesHeaderAction({ className, onAdd }: SalesHeaderActionProps) {
  const t = useT();
  return (
    <Button type='button' className={className ?? 'h-8'} onClick={onAdd}>
      <Icons.add className='me-2 h-4 w-4' />
      {t('common.newSale')}
    </Button>
  );
}

export function SalesListClient({ defaultOpenAdd = false }: SalesListClientProps) {
  const t = useT();
  const [open, setOpen] = useState(defaultOpenAdd);

  return (
    <TablePageBody>
      <SalesTable
        toolbarAction={<SalesHeaderAction className='h-8' onAdd={() => setOpen(true)} />}
      />
      <FloatingActionButton label={t('common.newSale')} onClick={() => setOpen(true)} />
      <SaleCreateDialog open={open} onOpenChange={setOpen} clearDefaultQuery={defaultOpenAdd} />
    </TablePageBody>
  );
}

export function SaleDetailClient({ id }: SaleDetailClientProps) {
  const { data } = useSuspenseQuery(saleQueryOptions(id));
  const t = useT();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const activePayments = (data.payments ?? []).filter((p) => p.status === 'ACTIVE');
  const totalPaid = activePayments.reduce((acc, p) => acc + p.amount, 0);
  const outstanding = data.totalAmount - totalPaid;
  const isCancelled = data.status === 'CANCELLED';
  const hasReturns = (data.returns?.length ?? 0) > 0;

  return (
    <div className='space-y-6'>
      {cancelOpen && (
        <CancelSaleDialog sale={data} open={cancelOpen} onOpenChange={setCancelOpen} />
      )}
      {returnOpen && (
        <ReturnSaleDialog sale={data} open={returnOpen} onOpenChange={setReturnOpen} />
      )}

      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <div className='flex items-center gap-2'>
            <h3 className='text-2xl font-bold tracking-tight'>{data.saleNo}</h3>
            <Badge variant={isCancelled ? 'destructive' : 'default'}>{data.status}</Badge>
            {hasReturns && (
              <Badge
                variant='outline'
                className='border-amber-500/40 text-amber-600 dark:text-amber-400'
              >
                {t('dukaan.sale.itemsReturned')}
              </Badge>
            )}
          </div>
          <p className='mt-1 text-muted-foreground text-sm'>
            {data.customerName ?? t('dukaan.sale.walkIn')} · {formatIsoDate(data.saleDate)}
            {outstanding > 0 && !isCancelled && (
              <span className='font-medium text-amber-600 dark:text-amber-400'>
                {' '}
                · {t('dukaan.sale.outstandingUdhar')}: {formatPkr(outstanding)}
              </span>
            )}
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Link
            href={`/dashboard/sales/${id}/receipt`}
            className='border-border inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted'
          >
            <Icons.page className='me-1.5 h-4 w-4' />
            {t('dukaan.sale.printReceipt')}
          </Link>

          {!isCancelled && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-8'
              onClick={() => setReturnOpen(true)}
            >
              <Icons.history className='me-1.5 h-3.5 w-3.5 text-blue-500' />
              {t('dukaan.sale.recordReturn')}
            </Button>
          )}

          {!isCancelled && !hasReturns && (
            <Button
              type='button'
              variant='destructive'
              size='sm'
              className='h-8'
              onClick={() => setCancelOpen(true)}
            >
              <Icons.trash className='me-1.5 h-3.5 w-3.5' />
              {t('dukaan.sale.cancelSale')}
            </Button>
          )}
        </div>
      </div>

      {isCancelled && (
        <div className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
          <p className='font-semibold'>{t('dukaan.sale.saleCancelled')}</p>
          {data.cancelReason && (
            <p className='mt-1'>
              {t('dukaan.sale.reason')} {data.cancelReason}
            </p>
          )}
          {data.cancelledAt && (
            <p className='text-xs text-muted-foreground mt-0.5'>
              {t('dukaan.sale.cancelledOn')} {formatIsoDate(data.cancelledAt)}
            </p>
          )}
        </div>
      )}

      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('dukaan.sale.item')}</TableHead>
              <TableHead>IMEI</TableHead>
              <TableHead>{t('table.col.qty')}</TableHead>
              <TableHead>{t('dukaan.sale.price')}</TableHead>
              <TableHead className='text-end'>{t('common.total')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data.items ?? []).map((item) => (
              <TableRow key={item.id}>
                <TableCell className='font-medium'>{item.productName}</TableCell>
                <TableCell>{item.imei ?? '—'}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{formatPkr(item.unitPrice)}</TableCell>
                <TableCell className='text-end font-semibold'>{formatPkr(item.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <div className='rounded-lg border p-4 space-y-3'>
          <h4 className='font-semibold text-sm'>{t('dukaan.sale.paymentsRecorded')}</h4>
          {(data.payments ?? []).length === 0 ? (
            <p className='text-muted-foreground text-xs italic'>
              {t('dukaan.sale.noPaymentsRecorded')}
            </p>
          ) : (
            <div className='space-y-2'>
              {data.payments.map((p) => (
                <div
                  key={p.id}
                  className='flex items-center justify-between text-xs border-b pb-1.5 last:border-0'
                >
                  <div>
                    <span className='font-medium'>{formatPkr(p.amount)}</span> ·{' '}
                    {formatLabel(p.method)}
                    {p.status === 'CANCELLED' && (
                      <span className='ms-1 text-destructive'>{t('dukaan.sale.cancelled')}</span>
                    )}
                  </div>
                  <span className='text-muted-foreground font-mono text-[11px]'>
                    {formatIsoDate(p.createdAt, '')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='rounded-lg border p-4 space-y-2 text-sm'>
          <h4 className='font-semibold'>{t('dukaan.sale.saleSummary')}</h4>
          <div className='flex justify-between text-muted-foreground'>
            <span>{t('common.subtotal')}</span>
            <span>{formatPkr(data.subtotal)}</span>
          </div>
          <div className='flex justify-between text-muted-foreground'>
            <span>{t('common.discount')}</span>
            <span>-{formatPkr(data.discount)}</span>
          </div>
          <div className='flex justify-between font-semibold border-t pt-2'>
            <span>{t('dukaan.sale.totalAmount')}</span>
            <span>{formatPkr(data.totalAmount)}</span>
          </div>
          <div className='flex justify-between text-emerald-600 dark:text-emerald-400'>
            <span>{t('table.col.paid')}</span>
            <span>{formatPkr(totalPaid)}</span>
          </div>
          {outstanding > 0 && !isCancelled && (
            <div className='flex justify-between font-medium text-amber-600 dark:text-amber-400'>
              <span>{t('dukaan.sale.outstandingUdhar')}</span>
              <span>{formatPkr(outstanding)}</span>
            </div>
          )}
        </div>
      </div>

      {(data.returns ?? []).length > 0 && (
        <div className='rounded-lg border p-4 space-y-3'>
          <h4 className='font-semibold text-sm'>{t('dukaan.sale.returnsHistory')}</h4>
          <div className='space-y-2'>
            {data.returns.map((ret) => (
              <div key={ret.id} className='rounded-md border bg-muted/30 p-3 text-xs space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <span className='font-semibold'>{ret.reason}</span>
                  <span className='font-medium text-destructive'>
                    -{formatPkr(ret.returnAmount)}
                  </span>
                </div>
                <p className='text-muted-foreground'>
                  {t('dukaan.sale.date')} {formatIsoDate(ret.returnDate)}
                  {ret.notes ? ` · Notes: ${ret.notes}` : ''}
                </p>
                {ret.items && ret.items.length > 0 && (
                  <div className='pt-1'>
                    <span className='text-muted-foreground'>{t('dukaan.sale.returned')} </span>
                    {ret.items.map((ri, i) => (
                      <span key={i} className='font-medium'>
                        {t('dukaan.sale.itemQuantityCondition', {
                          productName: ri.productName,
                          quantity: ri.quantity,
                          condition: ri.condition
                        })}
                        {i < ret.items.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SaleReceiptClient({ id }: SaleReceiptClientProps) {
  const t = useT();
  const { data } = useSuspenseQuery(saleQueryOptions(id));
  const activePayments = (data.payments ?? []).filter((p) => p.status === 'ACTIVE');
  const paid = activePayments.reduce((acc, p) => acc + p.amount, 0);
  const outstanding = Math.max(0, data.totalAmount - paid);

  return (
    <div className='mx-auto max-w-lg space-y-4 rounded-lg border bg-white p-6 text-black print:border-0'>
      <div className='text-center'>
        <h1 className='text-xl font-bold'>{t('common.appName')}</h1>
        <p className='mt-2 font-medium'>
          {t('dukaan.sale.receipt')} {data.saleNo}
        </p>
        <p className='text-sm'>{formatIsoDate(data.saleDate)}</p>
      </div>
      <div className='text-sm'>
        {t('table.col.customer')}: {data.customerName ?? t('dukaan.sale.walkIn')}
      </div>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b text-start'>
            <th className='py-1'>{t('dukaan.sale.item')}</th>
            <th>IMEI</th>
            <th>{t('table.col.qty')}</th>
            <th className='text-end'>{t('table.col.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {(data.items ?? []).map((item) => (
            <tr key={item.id} className='border-b'>
              <td className='py-1'>{item.productName}</td>
              <td>{item.imei ?? '—'}</td>
              <td>{item.quantity}</td>
              <td className='text-end'>{formatPkr(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='space-y-1 text-sm'>
        <div className='flex justify-between'>
          <span>{t('common.subtotal')}</span>
          <span>{formatPkr(data.subtotal)}</span>
        </div>
        <div className='flex justify-between'>
          <span>{t('common.discount')}</span>
          <span>{formatPkr(data.discount)}</span>
        </div>
        <div className='flex justify-between font-semibold'>
          <span>{t('common.total')}</span>
          <span>{formatPkr(data.totalAmount)}</span>
        </div>
        <div className='flex justify-between'>
          <span>{t('table.col.paid')}</span>
          <span>{formatPkr(paid)}</span>
        </div>
        <div className='flex justify-between'>
          <span>{t('dukaan.sale.balance')}</span>
          <span>{formatPkr(outstanding)}</span>
        </div>
      </div>
      <Button type='button' className='print:hidden w-full' onClick={() => window.print()}>
        {t('dukaan.sale.printReceipt')}
      </Button>
    </div>
  );
}
