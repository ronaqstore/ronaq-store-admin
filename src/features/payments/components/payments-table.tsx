'use client';

import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';
import { useT } from '@/i18n/use-t';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { RowActionsMenu } from '@/components/common/row-actions-menu';
import {
  ResponsiveDataTable,
  type DetailConfig,
  type MobileItemConfig
} from '@/components/data-table';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { useDataTable } from '@/hooks/use-data-table';
import {
  parseActiveCancelledStatus,
  useDukaanListParams
} from '@/components/data-table/list-params';
import { formatIsoDate } from '@/lib/dates';
import { formatPkr } from '@/lib/dukaan/numbers';
import {
  firstFilterValue,
  MONEY_RANGE_RUPEES,
  parseFacetDateRange,
  parseRupeeMoneyRange
} from '@/lib/dukaan/money-range-filter';
import type { PaymentDTO } from '@/lib/api/types';
import { useState } from 'react';
import { paymentsQueryOptions } from '../api/queries';
import type { PaymentsListFilters } from '@/types';
import { CancelPaymentDialog } from './cancel-payment-dialog';
import { RecordPaymentDialog } from './record-payment-dialog';
import type { RowAction } from '@/types/dukaan';
import { formatPaymentMethod } from '@/lib/format-payment';
import {
  PAYMENT_METHOD_OPTIONS,
  parsePaymentMethodFilter
} from '@/lib/dukaan/payment-methods';
import {
  createActiveCancelledStatusColumn,
  createAmountColumn
} from '@/components/common/party-table-helpers';
import { customerAsyncFilter } from '@/components/common/customer-filter';

import type { PaymentRowActionsProps, PaymentsTableProps } from '@/types/payment';

function PaymentRowActions({ payment, onCancel }: PaymentRowActionsProps) {
  const t = useT();
  const isCancelled = payment.status === 'CANCELLED';

  if (isCancelled) return null;

  const actions: RowAction[] = [
    {
      label: t('common.cancel'),
      icon: Icons.trash,
      variant: 'destructive' as const,
      onClick: () => onCancel(payment)
    }
  ];

  return (
    <div onClick={(e) => e.stopPropagation()} data-slot='action-cell'>
      <RowActionsMenu actions={actions} />
    </div>
  );
}

const paymentMobileItem: MobileItemConfig<PaymentDTO> = {
  title: (row: PaymentDTO) => row.customerName || 'Walk-in',
  subtitle: (row: PaymentDTO) => (row.saleNo ? `Sale #${row.saleNo}` : 'Opening balance'),
  value: (row: PaymentDTO) => formatPkr(row.amount),
  badge: (row: PaymentDTO) => ({
    label: row.status === 'ACTIVE' ? 'Active' : 'Cancelled',
    tone: row.status === 'ACTIVE' ? 'success' : 'danger'
  }),
  meta: [(row: PaymentDTO) => formatIsoDate(row.paymentDate)]
};

export { formatPaymentMethod };

const paymentDetail: DetailConfig<PaymentDTO> = {
  mode: 'sheet',
  title: (row: PaymentDTO) => `Payment from ${row.customerName || 'Walk-in'}`,
  badge: (row: PaymentDTO) => ({
    label: row.status === 'ACTIVE' ? 'Active' : 'Cancelled',
    tone: row.status === 'ACTIVE' ? 'success' : 'danger'
  }),
  value: (row: PaymentDTO) => formatPkr(row.amount),
  sections: (row: PaymentDTO) => {
    const method = formatPaymentMethod(row.method, row.notes);
    let notes = row.notes || '—';
    const match = row.notes?.match(/\[Method:\s*([^\]]+)\]/i);
    if (match) {
      const cleaned = notes.replace(/\[Method:\s*[^\]]+\]\s*/i, '').trim();
      notes = cleaned || '—';
    }
    return [
      {
        title: 'Payment Details',
        fields: [
          { label: 'Date', value: formatIsoDate(row.paymentDate) },
          { label: 'Customer', value: row.customerName || 'Walk-in' },
          {
            label: 'Applied To',
            value: row.saleNo ? `Sale #${row.saleNo}` : 'Opening balance'
          },
          { label: 'Amount', value: formatPkr(row.amount) },
          { label: 'Method', value: method },
          { label: 'Status', value: row.status === 'ACTIVE' ? 'Active' : 'Cancelled' },
          { label: 'Notes', value: notes }
        ]
      }
    ];
  }
};

export function PaymentsTable({ toolbarAction }: PaymentsTableProps) {
  const t = useT();

  const [recordOpen, setRecordOpen] = useState(false);
  const [cancelPaymentTarget, setCancelPaymentTarget] = useState<PaymentDTO | null>(null);

  const sortableColumnIds = [
    'customerName',
    'paymentDate',
    'amount',
    'method',
    'status',
    'createdAt',
    'updatedAt'
  ];
  const { params, filters, sortBy, sortOrder, getPageCount } = useDukaanListParams<
    PaymentsListFilters['sortBy']
  >(sortableColumnIds, 'customerName', [
    'status',
    'customerId',
    'paymentDate',
    'amount',
    'saleNo',
    'method'
  ], 'paymentDate');

  const [searchParam] = useQueryState('search', parseAsString);
  const [customerNameParam] = useQueryState('customerName', parseAsString);
  const [statusParam] = useQueryState('status', parseAsString);
  const [saleNoParam] = useQueryState('saleNo', parseAsString);
  const [paymentDateParam] = useQueryState(
    'paymentDate',
    parseAsArrayOf(parseAsString, ',')
  );

  const search = searchParam || customerNameParam || undefined;
  const statusFilter = parseActiveCancelledStatus(
    (filters as Record<string, unknown>).status ?? statusParam
  );
  const customerId = firstFilterValue((filters as Record<string, unknown>).customerId);
  const saleNoFilter =
    firstFilterValue((filters as Record<string, unknown>).saleNo) ??
    (saleNoParam?.trim() || undefined);
  const methodFilter = parsePaymentMethodFilter(
    (filters as Record<string, unknown>).method
  );
  const amountRange = parseRupeeMoneyRange((filters as Record<string, unknown>).amount);
  const { from, to } = parseFacetDateRange(
    (filters as Record<string, unknown>).paymentDate ?? paymentDateParam
  );

  const { data, isFetching } = useQuery(
    paymentsQueryOptions({
      page: params.page,
      pageSize: params.perPage,
      search,
      customerId,
      saleNo: saleNoFilter,
      method: methodFilter,
      minAmount: amountRange.minAmount,
      maxAmount: amountRange.maxAmount,
      status: statusFilter,
      from,
      to,
      sortBy,
      sortOrder
    })
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = getPageCount(total);

  const columns: ColumnDef<PaymentDTO>[] = [
    {
      id: 'customerName',
      accessorKey: 'customerName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.col.customer')} />
      ),
      cell: ({ row }) => (
        <span className='font-normal text-foreground'>
          {row.original.customerName || (
            <span className='text-muted-foreground italic'>{t('payments.walkIn')}</span>
          )}
        </span>
      ),
      meta: {
        label: 'table.col.customer',
        placeholderKey: 'search.payments',
        variant: 'text',
        icon: Icons.search,
        type: 'text',
        primary: true,
        priority: 1,
        mobile: 'title'
      },
      enableColumnFilter: true,
      enableSorting: true
    },
    {
      id: 'customerId',
      accessorKey: 'customerId',
      accessorFn: (row) => row.customerId ?? '',
      header: () => null,
      cell: () => null,
      meta: {
        label: 'table.col.customer',
        variant: 'select',
        icon: Icons.user,
        asyncOptions: customerAsyncFilter,
        priority: 2,
        mobile: 'hidden'
      },
      enableColumnFilter: true,
      enableSorting: false,
      enableHiding: true
    },
    {
      id: 'paymentDate',
      accessorKey: 'paymentDate',
      accessorFn: (row) => row.paymentDate,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.col.date')} />,
      cell: ({ row }) => (
        <span className='font-normal text-foreground'>
          {formatIsoDate(row.original.paymentDate)}
        </span>
      ),
      meta: {
        label: 'table.col.date',
        variant: 'dateRange',
        priority: 2,
        mobile: 'meta'
      },
      enableColumnFilter: true,
      enableSorting: true
    },
    createAmountColumn<PaymentDTO>(t('table.col.amount'), {
      enableRangeFilter: true,
      range: MONEY_RANGE_RUPEES,
      unit: 'Rs'
    }),
    {
      id: 'saleNo',
      accessorKey: 'saleNo',
      accessorFn: (row) => row.saleNo ?? '',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('payments.appliedTo')} />
      ),
      cell: ({ row }) => (
        <span className='font-normal text-foreground'>
          {row.original.saleNo
            ? t('payments.saleNumber', { number: row.original.saleNo })
            : t('payments.oldUdhar')}
        </span>
      ),
      meta: {
        label: 'nav.sales',
        placeholderKey: 'nav.sales',
        variant: 'text',
        icon: Icons.search,
        priority: 3,
        mobile: 'subtitle'
      },
      enableColumnFilter: true,
      enableSorting: false
    },
    {
      id: 'method',
      accessorKey: 'method',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.col.method')} />
      ),
      cell: ({ row }) => (
        <span className='font-normal text-foreground'>
          {formatPaymentMethod(row.original.method, row.original.notes)}
        </span>
      ),
      meta: {
        label: 'table.col.method',
        variant: 'select',
        icon: Icons.cash,
        options: PAYMENT_METHOD_OPTIONS.map((opt) => ({
          label: opt.label,
          value: opt.value
        })),
        priority: 4,
        mobile: 'hidden'
      },
      enableColumnFilter: true,
      enableSorting: true
    },
    createActiveCancelledStatusColumn<PaymentDTO>(t('table.col.status')),
    {
      id: 'actions',
      size: 72,
      header: () => (
        <span className='h-8 inline-flex items-center text-xs font-medium text-foreground'>
          {t('table.actions')}
        </span>
      ),
      cell: ({ row }) => (
        <PaymentRowActions payment={row.original} onCancel={(p) => setCancelPaymentTarget(p)} />
      ),
      enableSorting: false
    }
  ];

  const { table } = useDataTable({
    data: items,
    columns,
    pageCount,
    rowCount: total,
    shallow: true,
    debounceMs: 400,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 }
    }
  });

  const handleOpenRecord = () => setRecordOpen(true);
  const handleCancelOpenChange = (open: boolean) => {
    if (!open) setCancelPaymentTarget(null);
  };

  const recordActionButton = (
    <div className='flex items-center gap-2'>
      {toolbarAction}
      <Button type='button' size='sm' className='h-8 gap-1.5' onClick={handleOpenRecord}>
        <Icons.add className='h-3.5 w-3.5' />
        <span>{t('payments.recordPayment')}</span>
      </Button>
    </div>
  );

  return (
    <>
      {recordOpen && <RecordPaymentDialog open={recordOpen} onOpenChange={setRecordOpen} />}

      {cancelPaymentTarget && (
        <CancelPaymentDialog
          payment={cancelPaymentTarget}
          open={!!cancelPaymentTarget}
          onOpenChange={handleCancelOpenChange}
        />
      )}

      <ResponsiveDataTable
        table={table}
        toolbarAction={recordActionButton}
        mobileItem={paymentMobileItem}
        detail={paymentDetail}
        isLoading={isFetching}
      />
    </>
  );
}
