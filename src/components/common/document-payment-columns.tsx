'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import { formatPkr } from '@/lib/dukaan/numbers';
import {
  outstandingAmount,
  sumActivePaid
} from '@/lib/dukaan/document-payment-state';
import type {
  DocumentColumnPriority,
  DocumentMoneyColumnOptions,
  DocumentPayBadge,
  DocumentPayTranslator,
  DocumentStatusFilterOption,
  HasDocumentPayments
} from '@/types/document-payment';
import { t } from '@/i18n';

export function documentOutstandingMeta(
  row: HasDocumentPayments,
  translate: DocumentPayTranslator = t
): string {
  if (row.status === 'CANCELLED' || row.isOpeningStock) return '';
  const outstanding = outstandingAmount(row.totalAmount, sumActivePaid(row.payments));
  return outstanding > 0
    ? `${translate('table.col.outstanding')} ${formatPkr(outstanding)}`
    : '';
}

export function createDocumentTotalColumn<T extends HasDocumentPayments>(
  opts?: Pick<
    DocumentMoneyColumnOptions,
    'totalPriority' | 'enableRangeFilter' | 'range' | 'unit'
  >
): ColumnDef<T> {
  const priority: DocumentColumnPriority = opts?.totalPriority ?? 3;
  const enableRange = opts?.enableRangeFilter === true;
  return {
    id: 'totalAmount',
    accessorKey: 'totalAmount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('table.col.total')} />
    ),
    cell: ({ row }) => (
      <span className='font-normal text-foreground'>
        {formatPkr(row.original.totalAmount)}
      </span>
    ),
    meta: {
      label: 'table.col.total',
      variant: enableRange ? 'range' : 'number',
      range: opts?.range,
      unit: opts?.unit,
      icon: enableRange ? Icons.cash : undefined,
      priority,
      mobile: 'value'
    },
    enableColumnFilter: enableRange,
    enableSorting: true
  };
}

export function createDocumentPaidColumn<T extends HasDocumentPayments>(
  opts?: Pick<
    DocumentMoneyColumnOptions,
    'paidPriority' | 'hidePaidForOpeningStock' | 'enableRangeFilter' | 'range' | 'unit'
  >
): ColumnDef<T> {
  const hideOpening = opts?.hidePaidForOpeningStock ?? false;
  const priority: DocumentColumnPriority = opts?.paidPriority ?? 3;
  const enableRange = opts?.enableRangeFilter === true;
  return {
    id: 'paid',
    accessorKey: 'paid',
    accessorFn: (row) =>
      hideOpening && row.isOpeningStock ? row.totalAmount : sumActivePaid(row.payments),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('table.col.paid')} />
    ),
    cell: ({ row }) => {
      if (hideOpening && row.original.isOpeningStock) {
        return <span className='text-muted-foreground'>—</span>;
      }
      return (
        <span className='font-normal text-foreground'>
          {formatPkr(sumActivePaid(row.original.payments))}
        </span>
      );
    },
    meta: {
      label: 'table.col.paid',
      variant: enableRange ? 'range' : 'number',
      range: opts?.range,
      unit: opts?.unit,
      icon: enableRange ? Icons.cash : undefined,
      priority
    },
    enableColumnFilter: enableRange,
    enableSorting: true
  };
}

export function createDocumentOutstandingColumn<T extends HasDocumentPayments>(
  opts?: Pick<
    DocumentMoneyColumnOptions,
    | 'outstandingPriority'
    | 'hidePaidForOpeningStock'
    | 'enableRangeFilter'
    | 'range'
    | 'unit'
  >
): ColumnDef<T> {
  const hideOpening = opts?.hidePaidForOpeningStock ?? false;
  const priority: DocumentColumnPriority = opts?.outstandingPriority ?? 2;
  const enableRange = opts?.enableRangeFilter === true;
  return {
    id: 'outstanding',
    accessorKey: 'outstanding',
    accessorFn: (row) => {
      if (row.status === 'CANCELLED' || (hideOpening && row.isOpeningStock)) return 0;
      return outstandingAmount(row.totalAmount, sumActivePaid(row.payments));
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('table.col.outstanding')} />
    ),
    cell: ({ row }) => {
      if (
        row.original.status === 'CANCELLED' ||
        (hideOpening && row.original.isOpeningStock)
      ) {
        return <span className='text-muted-foreground'>—</span>;
      }
      const outstanding = outstandingAmount(
        row.original.totalAmount,
        sumActivePaid(row.original.payments)
      );
      return (
        <span
          className={
            outstanding > 0
              ? 'font-normal tabular-nums text-amber-700 dark:text-amber-400'
              : 'font-normal text-foreground'
          }
        >
          {formatPkr(outstanding)}
        </span>
      );
    },
    meta: {
      label: 'table.col.outstanding',
      variant: enableRange ? 'range' : 'number',
      range: opts?.range,
      unit: opts?.unit,
      icon: enableRange ? Icons.cash : undefined,
      priority
    },
    enableColumnFilter: enableRange,
    enableSorting: true
  };
}

export function createDocumentPayStatusColumn<T extends HasDocumentPayments>(
  resolveBadge: (row: T, translate: DocumentPayTranslator) => DocumentPayBadge,
  filterOptions: DocumentStatusFilterOption[],
  statusPriority: DocumentColumnPriority = 3
): ColumnDef<T> {
  return {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('table.col.status')} />
    ),
    cell: ({ row }) => {
      const badge = resolveBadge(row.original, t);
      return <StatusBadge status={badge.status} label={badge.label} />;
    },
    meta: {
      label: 'table.col.status',
      variant: 'select',
      icon: Icons.status,
      options: filterOptions,
      priority: statusPriority,
      mobile: 'badge'
    },
    enableColumnFilter: true,
    enableSorting: false
  };
}
