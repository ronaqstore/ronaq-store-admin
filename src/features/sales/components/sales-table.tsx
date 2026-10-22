'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';
import { Badge } from '@/components/ui/badge';
import { TruncateText } from '@/components/common/truncate-text';
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
import { salePayBadge } from '@/lib/dukaan/document-payment-badges';
import { outstandingAmount, sumActivePaid } from '@/lib/dukaan/document-payment-state';
import type { SaleDTO } from '@/lib/api/types';
import type { DocumentStatusFilterOption } from '@/types/document-payment';
import type { SalesTableProps } from '@/types/sales';
import { salesQueryOptions } from '../api/queries';
import type { SalesListFilters } from '@/types';
import dynamic from 'next/dynamic';
import { SaleRowActions } from './sale-row-actions';
import {
  SALE_MONEY_RANGE_RUPEES,
  customerAsyncFilter,
  firstSaleFilterValue,
  parseRupeeMoneyRange,
  parseSalePayStatus,
  timestampToYmd
} from './sales-table-filters';

const STATUS_FILTER_OPTIONS: DocumentStatusFilterOption[] = [
  { label: staticT('status.paid'), value: 'PAID' },
  { label: staticT('status.partial'), value: 'PARTIAL' },
  { label: staticT('status.udhar'), value: 'UDHAR' },
  { label: staticT('status.cancelled'), value: 'CANCELLED' }
];

const CancelSaleDialog = dynamic(
  () => import('./cancel-sale-dialog').then((mod) => mod.CancelSaleDialog),
  { ssr: false }
);
const ReturnSaleDialog = dynamic(
  () => import('./return-sale-dialog').then((mod) => mod.ReturnSaleDialog),
  { ssr: false }
);

const saleMobileItem: MobileItemConfig<SaleDTO> = {
  leading: 'icon',
  leadingIcon: Icons.receipt,
  title: (row) => row.saleNo,
  subtitle: (row) => row.customerName ?? 'Walk-in',
  badge: (row) => salePayBadge(row, staticT),
  value: (row) => formatPkr(row.totalAmount),
  meta: [
    (row: SaleDTO) => formatIsoDate(row.saleDate),
    (row: SaleDTO) => documentOutstandingMeta(row, staticT)
  ],
  ariaLabel: (row: SaleDTO) =>
    `${row.saleNo}, ${row.customerName ?? 'Walk-in'}, ${formatPkr(row.totalAmount)}`
};

export function SalesTable({ toolbarAction }: SalesTableProps) {
  const t = useT();
  const router = useRouter();
  const [peekCancelSale, setPeekCancelSale] = useState<SaleDTO | null>(null);
  const [peekReturnSale, setPeekReturnSale] = useState<SaleDTO | null>(null);

  const sortableColumnIds = [
    'saleDate',
    'saleNo',
    'totalAmount',
    'paid',
    'outstanding'
  ];
  const { params, filters, sortBy, sortOrder, getPageCount } = useDukaanListParams<
    SalesListFilters['sortBy']
  >(sortableColumnIds, 'saleDate', [
    'status',
    'customerId',
    'saleDate',
    'totalAmount',
    'paid',
    'outstanding'
  ], 'saleDate');

  const [saleNoParam] = useQueryState('saleNo', parseAsString);
  const [searchParam] = useQueryState('search', parseAsString);
  const [statusParam] = useQueryState('status', parseAsString);
  const [saleDateParam] = useQueryState('saleDate', parseAsArrayOf(parseAsString, ','));

  const search = searchParam || saleNoParam || undefined;
  const documentStatusFilter = parseActiveCancelledStatus(
    (filters as Record<string, unknown>).status ?? statusParam
  );
  const payStatusFilter = parseSalePayStatus(
    (filters as Record<string, unknown>).status ?? statusParam
  );
  const customerId = firstSaleFilterValue(
    (filters as Record<string, unknown>).customerId
  );
  const totalRange = parseRupeeMoneyRange(
    (filters as Record<string, unknown>).totalAmount
  );
  const paidRange = parseRupeeMoneyRange((filters as Record<string, unknown>).paid);
  const outstandingRange = parseRupeeMoneyRange(
    (filters as Record<string, unknown>).outstanding
  );
  const dateRaw =
    (filters as Record<string, unknown>).saleDate ?? saleDateParam;
  const dateParts = Array.isArray(dateRaw)
    ? (dateRaw as string[])
    : typeof dateRaw === 'string'
      ? dateRaw.split(',')
      : [];
  const from = timestampToYmd(dateParts[0]);
  const to = timestampToYmd(dateParts[1]);

  const backendSortBy =
    sortBy === 'saleDate' ||
    sortBy === 'saleNo' ||
    sortBy === 'totalAmount' ||
    sortBy === 'paid' ||
    sortBy === 'outstanding'
      ? sortBy
      : 'saleDate';

  const { data, isFetching } = useQuery(
    salesQueryOptions({
      page: params.page,
      pageSize: params.perPage,
      search: search || undefined,
      customerId,
      status: documentStatusFilter,
      payStatus: payStatusFilter,
      from,
      to,
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

  const columns: ColumnDef<SaleDTO>[] = [
    {
      id: 'saleNo',
      accessorKey: 'saleNo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('sales.saleNoCol')} />
      ),
      cell: ({ row }) => {
        const hasReturns = (row.original.returns?.length ?? 0) > 0;
        return (
          <div className='flex items-center gap-1.5 font-normal text-foreground'>
            <span>{row.original.saleNo}</span>
            {hasReturns && (
              <Badge
                variant='outline'
                className='border-amber-500/40 text-[10px] text-amber-600 dark:text-amber-400'
              >
                {t('sales.returnBadge')}
              </Badge>
            )}
          </div>
        );
      },
      meta: {
        label: 'table.col.no',
        placeholderKey: 'search.sales',
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.col.customer')} />
      ),
      cell: ({ row }) =>
        row.original.customerName ? (
          <TruncateText className='font-normal text-foreground'>
            {row.original.customerName}
          </TruncateText>
        ) : (
          <span className='text-muted-foreground italic'>{t('sales.walkInBadge')}</span>
        ),
      meta: {
        label: 'table.col.customer',
        variant: 'select',
        icon: Icons.user,
        asyncOptions: customerAsyncFilter,
        priority: 2,
        mobile: 'subtitle'
      },
      enableColumnFilter: true,
      enableSorting: false
    },
    {
      id: 'saleDate',
      accessorKey: 'saleDate',
      accessorFn: (row) => row.saleDate,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.col.date')} />,
      cell: ({ row }) => (
        <span className='font-normal text-foreground'>{formatIsoDate(row.original.saleDate)}</span>
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
    createDocumentTotalColumn<SaleDTO>({
      totalPriority: 1,
      enableRangeFilter: true,
      range: SALE_MONEY_RANGE_RUPEES,
      unit: 'Rs'
    }),
    createDocumentPaidColumn<SaleDTO>({
      paidPriority: 2,
      enableRangeFilter: true,
      range: SALE_MONEY_RANGE_RUPEES,
      unit: 'Rs'
    }),
    createDocumentOutstandingColumn<SaleDTO>({
      outstandingPriority: 2,
      enableRangeFilter: true,
      range: SALE_MONEY_RANGE_RUPEES,
      unit: 'Rs'
    }),
    createDocumentPayStatusColumn<SaleDTO>(salePayBadge, STATUS_FILTER_OPTIONS, 1),
    {
      id: 'actions',
      size: 48,
      enableSorting: false,
      enableHiding: false,
      meta: { mobile: 'hidden' },
      cell: ({ row }) => <SaleRowActions sale={row.original} />
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

  const salesQuickFilters: QuickFilterChip[] = [
    { id: 'all', label: t('table.all') },
    {
      id: 'udhar',
      label: t('status.udhar'),
      columnId: 'status',
      value: ['UDHAR']
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

  const saleDetail: DetailConfig<SaleDTO> = useMemo(
    () => ({
      mode: 'sheet',
      title: (row) => row.saleNo,
      badge: (row) => salePayBadge(row, t),
      value: (row) => formatPkr(row.totalAmount),
      sections: (row) => {
        const paid = sumActivePaid(row.payments);
        const outstanding =
          row.status === 'CANCELLED' ? 0 : outstandingAmount(row.totalAmount, paid);
        const badge = salePayBadge(row, t);
        return [
        {
          title: t('pages.sales.title'),
          fields: [
            { label: t('sales.saleNoCol'), value: row.saleNo },
            { label: t('table.col.date'), value: formatIsoDate(row.saleDate) },
            {
              label: t('table.col.customer'),
              value: row.customerName ?? t('sales.walkInBadge')
            },
            { label: t('table.col.total'), value: formatPkr(row.totalAmount) },
            {
              label: t('table.col.paid'),
              value: formatPkr(paid)
            },
            {
              label: t('table.col.outstanding'),
              value:
                row.status === 'CANCELLED' ? '—' : formatPkr(outstanding)
            },
            {
              label: t('table.col.status'),
              value: <StatusBadge status={badge.status} label={badge.label} />
            }
          ]
        },
        ...(row.status === 'CANCELLED' && row.cancelledAt
          ? [
              {
                title: t('status.cancelled'),
                fields: [
                  { label: t('table.col.note'), value: row.cancelReason || '—' },
                  {
                    label: t('table.col.date'),
                    value: formatIsoDate(row.cancelledAt)
                  }
                ]
              }
            ]
          : [])
        ];
      },
      actions: (row) => {
        const isCancelled = row.status === 'CANCELLED';
        const hasReturns = (row.returns?.length ?? 0) > 0;
        return [
          {
            label: t('common.view'),
            onClick: () => router.push(`/dashboard/sales/${row.id}`)
          },
          ...(!isCancelled
            ? [
                {
                  label: t('sales.returnBadge'),
                  variant: 'secondary' as const,
                  onClick: () => setPeekReturnSale(row)
                }
              ]
            : []),
          ...(!isCancelled && !hasReturns
            ? [
                {
                  label: t('common.cancel'),
                  variant: 'destructive' as const,
                  onClick: () => setPeekCancelSale(row)
                }
              ]
            : [])
        ];
      }
    }),
    [router, t]
  );

  return (
    <>
      {peekCancelSale ? (
        <CancelSaleDialog
          sale={peekCancelSale}
          open
          onOpenChange={(open: boolean) => {
            if (!open) setPeekCancelSale(null);
          }}
        />
      ) : null}
      {peekReturnSale ? (
        <ReturnSaleDialog
          sale={peekReturnSale}
          open
          onOpenChange={(open: boolean) => {
            if (!open) setPeekReturnSale(null);
          }}
        />
      ) : null}
      <ResponsiveDataTable
        table={table}
        toolbarAction={toolbarAction}
        mobileItem={saleMobileItem}
        detail={saleDetail}
        quickFilters={salesQuickFilters}
        isLoading={isFetching}
      />
    </>
  );
}
