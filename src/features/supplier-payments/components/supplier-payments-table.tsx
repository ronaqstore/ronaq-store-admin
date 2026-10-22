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
import {
  createActiveCancelledStatusColumn,
  createAmountColumn
} from '@/components/common/party-table-helpers';
import { supplierAsyncFilter } from '@/components/common/supplier-filter';
import type {
  SupplierPaymentDTO,
  SupplierPaymentQueryFilter,
  SupplierPaymentRowActionsProps,
  SupplierPaymentsTableProps
} from '@/types/supplier-payment';
import { useState } from 'react';
import { supplierPaymentsQueryOptions } from '../api/queries';
import { CancelSupplierPaymentDialog } from './cancel-supplier-payment-dialog';
import { RecordSupplierPaymentDialog } from './record-supplier-payment-dialog';
import { SupplierPaymentDetailSheet } from './supplier-payment-detail-sheet';

function SupplierPaymentRowActions({ payment, onCancel }: SupplierPaymentRowActionsProps) {
  const t = useT();
  const isCancelled = payment.status === 'CANCELLED';

  if (isCancelled) return null;

  return (
    <div onClick={(e) => e.stopPropagation()} data-slot='action-cell'>
      <RowActionsMenu
        actions={[
          {
            label: t('common.cancel'),
            icon: Icons.close,
            variant: 'destructive',
            onClick: () => onCancel(payment)
          }
        ]}
      />
    </div>
  );
}

const supplierPaymentMobileItem: MobileItemConfig<SupplierPaymentDTO> = {
  title: (row: SupplierPaymentDTO) => row.supplierName || 'Supplier',
  subtitle: (row: SupplierPaymentDTO) =>
    row.purchaseNo ? `Bill #${row.purchaseNo}` : 'Opening Balance',
  value: (row: SupplierPaymentDTO) => formatPkr(row.amount),
  badge: (row: SupplierPaymentDTO) => ({
    label: row.status === 'ACTIVE' ? 'Active' : 'Cancelled',
    status: row.status
  }),
  meta: [(row: SupplierPaymentDTO) => formatIsoDate(row.paymentDate)]
};

const supplierPaymentDetail: DetailConfig<SupplierPaymentDTO> = {
  mode: 'sheet',
  title: (row: SupplierPaymentDTO) => `Payment to ${row.supplierName || 'Supplier'}`,
  badge: (row: SupplierPaymentDTO) => ({
    label: row.status === 'ACTIVE' ? 'Active' : 'Cancelled',
    status: row.status
  }),
  value: (row: SupplierPaymentDTO) => formatPkr(row.amount),
  sections: (row: SupplierPaymentDTO) => [
    {
      title: 'Payment Details',
      fields: [
        { label: 'Date', value: formatIsoDate(row.paymentDate) },
        { label: 'Supplier', value: row.supplierName || '—' },
        {
          label: 'Applied To',
          value: row.purchaseNo ? `Bill #${row.purchaseNo}` : 'Opening Balance'
        },
        { label: 'Amount', value: formatPkr(row.amount) },
        { label: 'Status', value: row.status === 'ACTIVE' ? 'Active' : 'Cancelled' },
        { label: 'Notes', value: row.notes || '—' }
      ]
    }
  ]
};

export function SupplierPaymentsTable({ toolbarAction }: SupplierPaymentsTableProps) {
  const t = useT();

  const [recordOpen, setRecordOpen] = useState(false);
  const [cancelPaymentTarget, setCancelPaymentTarget] = useState<SupplierPaymentDTO | null>(null);
  const [detailPayment, setDetailPayment] = useState<SupplierPaymentDTO | null>(null);

  const sortableColumnIds = [
    'supplierName',
    'paymentDate',
    'amount',
    'status',
    'createdAt',
    'updatedAt'
  ];
  const { params, filters, sortBy, sortOrder, getPageCount } = useDukaanListParams<
    SupplierPaymentQueryFilter['sortBy']
  >(sortableColumnIds, 'supplierName', [
    'status',
    'supplierId',
    'paymentDate',
    'amount',
    'target',
    'notes'
  ], 'paymentDate');

  const [searchParam] = useQueryState('search', parseAsString);
  const [supplierNameParam] = useQueryState('supplierName', parseAsString);
  const [statusParam] = useQueryState('status', parseAsString);
  const [notesParam] = useQueryState('notes', parseAsString);
  const [targetParam] = useQueryState('target', parseAsString);
  const [paymentDateParam] = useQueryState(
    'paymentDate',
    parseAsArrayOf(parseAsString, ',')
  );

  const search = searchParam || supplierNameParam || undefined;
  const statusFilter = parseActiveCancelledStatus(
    (filters as Record<string, unknown>).status ?? statusParam
  );
  const supplierId = firstFilterValue((filters as Record<string, unknown>).supplierId);
  const notesFilter =
    firstFilterValue((filters as Record<string, unknown>).notes) ??
    (notesParam?.trim() || undefined);
  const purchaseNoFilter =
    firstFilterValue((filters as Record<string, unknown>).target) ??
    (targetParam?.trim() || undefined);
  const amountRange = parseRupeeMoneyRange((filters as Record<string, unknown>).amount);
  const { from, to } = parseFacetDateRange(
    (filters as Record<string, unknown>).paymentDate ?? paymentDateParam
  );

  const { data, isFetching } = useQuery(
    supplierPaymentsQueryOptions({
      page: params.page,
      pageSize: params.perPage,
      search,
      supplierId,
      purchaseNo: purchaseNoFilter,
      notes: notesFilter,
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

  const columns: ColumnDef<SupplierPaymentDTO>[] = [
    {
      id: 'supplierName',
      accessorKey: 'supplierName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.col.supplier')} />
      ),
      cell: ({ row }) => (
        <span className='font-normal text-foreground'>
          {row.original.supplierName || <span className='text-muted-foreground italic'>—</span>}
        </span>
      ),
      meta: {
        label: 'table.col.supplier',
        placeholderKey: 'search.supplierPayments',
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
      id: 'supplierId',
      accessorKey: 'supplierId',
      accessorFn: (row) => row.supplierId ?? '',
      header: () => null,
      cell: () => null,
      meta: {
        label: 'table.col.supplier',
        variant: 'select',
        icon: Icons.user,
        asyncOptions: supplierAsyncFilter,
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
    createAmountColumn<SupplierPaymentDTO>(t('table.col.amount'), {
      enableRangeFilter: true,
      range: MONEY_RANGE_RUPEES,
      unit: 'Rs'
    }),
    {
      id: 'target',
      accessorFn: (row) => row.purchaseNo ?? '',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('supplierPayments.appliedTo')} />
      ),
      cell: ({ row }) => (
        <span className='font-normal text-foreground'>
          {row.original.purchaseNo
            ? `Bill #${row.original.purchaseNo}`
            : t('supplierPayments.openingBalance')}
        </span>
      ),
      meta: {
        label: 'table.col.target',
        placeholderKey: 'table.col.target',
        variant: 'text',
        icon: Icons.search,
        priority: 3,
        mobile: 'subtitle'
      },
      enableColumnFilter: true,
      enableSorting: false
    },
    {
      id: 'notes',
      accessorKey: 'notes',
      accessorFn: (row) => row.notes ?? '',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.col.notes')} />
      ),
      cell: ({ row }) => (
        <span className='font-normal text-muted-foreground truncate max-w-[200px] inline-block'>
          {row.original.notes || '—'}
        </span>
      ),
      meta: {
        label: 'table.col.notes',
        placeholderKey: 'table.col.notes',
        variant: 'text',
        icon: Icons.search,
        priority: 4,
        mobile: 'hidden'
      },
      enableColumnFilter: true,
      enableSorting: false
    },
    createActiveCancelledStatusColumn<SupplierPaymentDTO>(t('table.col.status')),
    {
      id: 'actions',
      size: 72,
      header: () => (
        <span className='h-8 inline-flex items-center text-xs font-medium text-foreground'>
          {t('table.actions')}
        </span>
      ),
      cell: ({ row }) => (
        <SupplierPaymentRowActions
          payment={row.original}
          onCancel={(p) => setCancelPaymentTarget(p)}
        />
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

  const recordActionButton = (
    <div className='flex items-center gap-2'>
      {toolbarAction}
      <Button type='button' size='sm' className='h-8 gap-1.5' onClick={() => setRecordOpen(true)}>
        <Icons.add className='h-3.5 w-3.5' />
        <span>{t('supplierPayments.addPayment')}</span>
      </Button>
    </div>
  );

  return (
    <>
      {recordOpen && <RecordSupplierPaymentDialog open={recordOpen} onOpenChange={setRecordOpen} />}

      {cancelPaymentTarget && (
        <CancelSupplierPaymentDialog
          payment={cancelPaymentTarget}
          open={!!cancelPaymentTarget}
          onOpenChange={(open) => {
            if (!open) setCancelPaymentTarget(null);
          }}
        />
      )}

      {detailPayment && (
        <SupplierPaymentDetailSheet
          payment={detailPayment}
          open={!!detailPayment}
          onOpenChange={(open) => {
            if (!open) setDetailPayment(null);
          }}
          onCancelClick={(p) => setCancelPaymentTarget(p)}
        />
      )}

      <ResponsiveDataTable
        table={table}
        toolbarAction={recordActionButton}
        mobileItem={supplierPaymentMobileItem}
        detail={supplierPaymentDetail}
        isLoading={isFetching}
      />
    </>
  );
}
