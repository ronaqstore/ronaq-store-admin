'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { Badge } from '@/components/ui/badge';
import { RowActionsMenu } from '@/components/common/row-actions-menu';
import {
  ResponsiveDataTable,
  StatusBadge,
  type DetailConfig,
  type MobileItemConfig,
  type QuickFilterChip
} from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import {
  createDocumentOutstandingColumn,
  createDocumentPaidColumn,
  createDocumentPayStatusColumn,
  createDocumentTotalColumn,
  documentOutstandingMeta
} from '@/components/common/document-payment-columns';
import { useDataTable } from '@/hooks/use-data-table';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import { t as staticT } from '@/i18n';
import { useRouter } from '@/i18n/navigation';
import {
  DUKAAN_DEFAULT_PAGE_SIZE,
  parseActiveCancelledStatus,
  useDukaanListParams
} from '@/components/data-table/list-params';
import { formatIsoDate } from '@/lib/dates';
import { formatPkr } from '@/lib/dukaan/numbers';
import { purchasePayBadge } from '@/lib/dukaan/document-payment-badges';
import { outstandingAmount, sumActivePaid } from '@/lib/dukaan/document-payment-state';
import type { PurchaseDTO } from '@/lib/api/types';
import type { DocumentStatusFilterOption } from '@/types/document-payment';
import type { PurchaseRowActionsProps, PurchasesTableProps } from '@/types/purchases';
import { purchasesQueryOptions } from '../api/queries';
import type { PurchasesListFilters } from '@/types';
import { CancelPurchaseDialog } from './cancel-purchase-dialog';
import {
  PURCHASE_MONEY_RANGE_RUPEES,
  firstPurchaseFilterValue,
  parsePurchasePayStatus,
  parseRupeeMoneyRange,
  supplierAsyncFilter
} from './purchases-table-filters';

const STATUS_FILTER_OPTIONS: DocumentStatusFilterOption[] = [
  { label: staticT('status.payable'), value: 'PAYABLE' },
  { label: staticT('status.partial'), value: 'PARTIAL' },
  { label: staticT('status.paid'), value: 'PAID' },
  { label: staticT('status.cancelled'), value: 'CANCELLED' }
];

function PurchaseRowActions({ purchase }: PurchaseRowActionsProps) {
  const t = useT();
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const isCancelled = purchase.status === 'CANCELLED';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role='presentation'
      data-slot='action-cell'
    >
      {cancelOpen && (
        <CancelPurchaseDialog purchase={purchase} open={cancelOpen} onOpenChange={setCancelOpen} />
      )}

      <RowActionsMenu
        actions={[
          {
            label: t('common.view'),
            icon: Icons.page,
            onClick: () => router.push(`/dashboard/purchases/${purchase.id}`)
          },
          ...(!isCancelled
            ? [
                {
                  label: t('common.cancel'),
                  icon: Icons.close,
                  variant: 'destructive' as const,
                  onClick: () => setCancelOpen(true)
                }
              ]
            : [])
        ]}
      />
    </div>
  );
}

const purchaseMobileItem: MobileItemConfig<PurchaseDTO> = {
  leading: 'icon',
  leadingIcon: Icons.receipt,
  title: (row) => row.purchaseNo,
  subtitle: (row) => row.supplierInvoiceRef || row.supplierName || '—',
  badge: (row) => purchasePayBadge(row, staticT),
  value: (row) => formatPkr(row.totalAmount),
  meta: [
    (row) => formatIsoDate(row.purchaseDate),
    (row) => documentOutstandingMeta(row, staticT)
  ],
  ariaLabel: (row) => `${row.purchaseNo}, ${row.supplierName ?? ''}, ${formatPkr(row.totalAmount)}`
};

export function PurchasesTable({ toolbarAction }: PurchasesTableProps) {
  const t = useT();
  const router = useRouter();
  const [peekCancelPurchase, setPeekCancelPurchase] = useState<PurchaseDTO | null>(null);
  const sortableColumnIds = [
    'purchaseDate',
    'purchaseNo',
    'totalAmount',
    'paid',
    'outstanding',
    'status',
    'createdAt',
    'updatedAt'
  ];
  const { params, filters, sortBy, sortOrder, getPageCount } = useDukaanListParams<
    PurchasesListFilters['sortBy']
  >(sortableColumnIds, 'purchaseDate', [
    'status',
    'supplierId',
    'totalAmount',
    'paid',
    'outstanding'
  ], 'purchaseDate');

  const [purchaseNoParam] = useQueryState('purchaseNo', parseAsString);
  const [searchParam] = useQueryState('search', parseAsString);
  const [statusParam] = useQueryState('status', parseAsString);

  const search = searchParam || purchaseNoParam || undefined;
  const documentStatusFilter = parseActiveCancelledStatus(
    (filters as Record<string, unknown>).status ?? statusParam
  );
  const payStatusFilter = parsePurchasePayStatus(
    (filters as Record<string, unknown>).status ?? statusParam
  );
  const supplierId = firstPurchaseFilterValue(
    (filters as Record<string, unknown>).supplierId
  );
  const totalRange = parseRupeeMoneyRange(
    (filters as Record<string, unknown>).totalAmount
  );
  const paidRange = parseRupeeMoneyRange((filters as Record<string, unknown>).paid);
  const outstandingRange = parseRupeeMoneyRange(
    (filters as Record<string, unknown>).outstanding
  );

  const backendSortBy =
    sortBy === 'purchaseDate' ||
    sortBy === 'purchaseNo' ||
    sortBy === 'totalAmount' ||
    sortBy === 'createdAt' ||
    sortBy === 'updatedAt' ||
    sortBy === 'status'
      ? sortBy
      : 'purchaseDate';

  const { data, isFetching } = useQuery(
    purchasesQueryOptions({
      page: params.page,
      pageSize: params.perPage,
      search: search || undefined,
      supplierId,
      status: documentStatusFilter,
      payStatus: payStatusFilter,
      minTotalAmount: totalRange.minAmount,
      maxTotalAmount: totalRange.maxAmount,
      minPaidAmount: paidRange.minAmount,
      maxPaidAmount: paidRange.maxAmount,
      minOutstandingAmount: outstandingRange.minAmount,
      maxOutstandingAmount: outstandingRange.maxAmount,
      sortBy: backendSortBy,
      sortOrder
    })
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = getPageCount(total);

  const columns: ColumnDef<PurchaseDTO>[] = [
    {
      id: 'purchaseNo',
      accessorKey: 'purchaseNo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('purchases.purchaseNoCol')} />
      ),
      cell: ({ row }) => (
        <div className='flex items-center gap-1.5 font-normal text-foreground'>
          <span>{row.original.purchaseNo}</span>
          {row.original.isOpeningStock && (
            <Badge
              variant='outline'
              className='border-blue-500/40 text-[10px] text-blue-600 dark:text-blue-400'
            >
              {t('purchases.openingBadge')}
            </Badge>
          )}
        </div>
      ),
      meta: {
        label: 'table.col.no',
        placeholderKey: 'search.purchases',
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
      id: 'purchaseDate',
      accessorKey: 'purchaseDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.col.date')} />,
      cell: ({ row }) => (
        <span className='font-normal text-foreground'>
          {formatIsoDate(row.original.purchaseDate)}
        </span>
      ),
      meta: {
        label: 'table.col.date',
        variant: 'date',
        priority: 2,
        mobile: 'meta'
      },
      enableColumnFilter: false,
      enableSorting: true
    },
    {
      id: 'supplierId',
      accessorKey: 'supplierId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.col.supplier')} />
      ),
      cell: ({ row }) => (
        <span className='font-normal text-foreground'>{row.original.supplierName || '—'}</span>
      ),
      meta: {
        label: 'table.col.supplier',
        variant: 'select',
        icon: Icons.truck,
        asyncOptions: supplierAsyncFilter,
        priority: 2,
        mobile: 'subtitle'
      },
      enableColumnFilter: true,
      enableSorting: false
    },
    {
      id: 'supplierInvoiceRef',
      accessorKey: 'supplierInvoiceRef',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.col.supplierInvoice')} />
      ),
      cell: ({ row }) => (
        <span className='font-normal text-foreground'>
          {row.original.supplierInvoiceRef || '—'}
        </span>
      ),
      meta: {
        label: 'table.col.supplierInvoice',
        variant: 'text',
        priority: 3,
        mobile: 'hidden'
      },
      enableColumnFilter: false,
      enableSorting: false
    },
    createDocumentTotalColumn<PurchaseDTO>({
      totalPriority: 1,
      enableRangeFilter: true,
      range: PURCHASE_MONEY_RANGE_RUPEES,
      unit: 'Rs'
    }),
    createDocumentPaidColumn<PurchaseDTO>({
      paidPriority: 2,
      hidePaidForOpeningStock: true,
      enableRangeFilter: true,
      range: PURCHASE_MONEY_RANGE_RUPEES,
      unit: 'Rs'
    }),
    createDocumentOutstandingColumn<PurchaseDTO>({
      outstandingPriority: 2,
      hidePaidForOpeningStock: true,
      enableRangeFilter: true,
      range: PURCHASE_MONEY_RANGE_RUPEES,
      unit: 'Rs'
    }),
    createDocumentPayStatusColumn<PurchaseDTO>(purchasePayBadge, STATUS_FILTER_OPTIONS, 1),
    {
      id: 'actions',
      size: 48,
      enableSorting: false,
      enableHiding: false,
      meta: { mobile: 'hidden' },
      cell: ({ row }) => <PurchaseRowActions purchase={row.original} />
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
      pagination: { pageIndex: 0, pageSize: DUKAAN_DEFAULT_PAGE_SIZE }
    }
  });

  const purchaseQuickFilters: QuickFilterChip[] = [
    { id: 'all', label: t('table.all') },
    {
      id: 'payable',
      label: t('status.payable'),
      columnId: 'status',
      value: ['PAYABLE']
    },
    {
      id: 'partial',
      label: t('status.partial'),
      columnId: 'status',
      value: ['PARTIAL']
    },
    {
      id: 'paid',
      label: t('status.paid'),
      columnId: 'status',
      value: ['PAID']
    },
    {
      id: 'cancelled',
      label: t('status.cancelled'),
      columnId: 'status',
      value: ['CANCELLED']
    }
  ];

  const purchaseDetail: DetailConfig<PurchaseDTO> = useMemo(
    () => ({
      mode: 'sheet',
      title: (row) => row.purchaseNo,
      badge: (row) => purchasePayBadge(row, t),
      value: (row) => formatPkr(row.totalAmount),
      sections: (row) => {
        const paid = sumActivePaid(row.payments);
        const outstanding =
          row.status === 'CANCELLED' || row.isOpeningStock
            ? 0
            : outstandingAmount(row.totalAmount, paid);
        const badge = purchasePayBadge(row, t);
        return [
          {
            title: t('pages.purchases.title'),
            fields: [
              { label: t('purchases.purchaseNoCol'), value: row.purchaseNo },
              { label: t('table.col.date'), value: formatIsoDate(row.purchaseDate) },
              { label: t('table.col.supplier'), value: row.supplierName ?? '—' },
              { label: t('table.col.supplierInvoice'), value: row.supplierInvoiceRef ?? '—' },
              { label: t('table.col.total'), value: formatPkr(row.totalAmount) },
              ...(row.isOpeningStock
                ? []
                : [
                    { label: t('table.col.paid'), value: formatPkr(paid) },
                    {
                      label: t('table.col.outstanding'),
                      value:
                        row.status === 'CANCELLED' ? '—' : formatPkr(outstanding)
                    }
                  ]),
              {
                label: t('table.col.status'),
                value: <StatusBadge status={badge.status} label={badge.label} />
              },
              ...(row.isOpeningStock
                ? [
                    {
                      label: t('purchases.openingBadge'),
                      value: t('purchases.openingBadge')
                    }
                  ]
                : [])
            ]
          }
        ];
      },
      actions: (row) => [
        {
          label: t('common.view'),
          onClick: () => router.push(`/dashboard/purchases/${row.id}`)
        },
        ...(row.status !== 'CANCELLED'
          ? [
              {
                label: t('common.cancel'),
                variant: 'destructive' as const,
                onClick: () => setPeekCancelPurchase(row)
              }
            ]
          : [])
      ]
    }),
    [router, t]
  );

  return (
    <>
      {peekCancelPurchase ? (
        <CancelPurchaseDialog
          purchase={peekCancelPurchase}
          open
          onOpenChange={(open) => {
            if (!open) setPeekCancelPurchase(null);
          }}
        />
      ) : null}
      <ResponsiveDataTable
        table={table}
        toolbarAction={toolbarAction}
        mobileItem={purchaseMobileItem}
        detail={purchaseDetail}
        quickFilters={purchaseQuickFilters}
        isLoading={isFetching}
      />
    </>
  );
}
