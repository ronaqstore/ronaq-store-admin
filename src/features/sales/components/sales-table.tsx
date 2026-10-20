'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { Badge } from '@/components/ui/badge';
import { RowActionsMenu } from '@/components/common/row-actions-menu';
import { TruncateText } from '@/components/common/truncate-text';
import type { RowAction } from '@/types/dukaan';
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
import type { SaleRowActionsProps, SalesTableProps } from '@/types/sales';
import { salesQueryOptions } from '../api/queries';
import type { SalesListFilters } from '@/types';
import dynamic from 'next/dynamic';

const CancelSaleDialog = dynamic(
  () => import('./cancel-sale-dialog').then((mod) => mod.CancelSaleDialog),
  { ssr: false }
);
const ReturnSaleDialog = dynamic(
  () => import('./return-sale-dialog').then((mod) => mod.ReturnSaleDialog),
  { ssr: false }
);

function SaleRowActions({ sale }: SaleRowActionsProps) {
  const t = useT();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const hasReturns = (sale.returns?.length ?? 0) > 0;
  const isCancelled = sale.status === 'CANCELLED';

  const actions: RowAction[] = [
    {
      label: t('common.view'),
      icon: Icons.page,
      href: `/dashboard/sales/${sale.id}`
    },
    ...(!isCancelled
      ? [
          {
            label: t('sales.returnBadge'),
            icon: Icons.history,
            className: 'text-blue-500',
            onClick: () => setReturnOpen(true)
          }
        ]
      : []),
    ...(!isCancelled && !hasReturns
      ? [
          {
            label: t('common.cancel'),
            icon: Icons.trash,
            variant: 'destructive' as const,
            onClick: () => setCancelOpen(true)
          }
        ]
      : [])
  ];

  return (
    <div onClick={(e) => e.stopPropagation()} data-slot='action-cell'>
      {cancelOpen && (
        <CancelSaleDialog sale={sale} open={cancelOpen} onOpenChange={setCancelOpen} />
      )}
      {returnOpen && (
        <ReturnSaleDialog sale={sale} open={returnOpen} onOpenChange={setReturnOpen} />
      )}

      <RowActionsMenu actions={actions} />
    </div>
  );
}

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
    'outstanding',
    'status',
    'createdAt',
    'updatedAt'
  ];
  const { params, sortBy, sortOrder, getPageCount } = useDukaanListParams<
    SalesListFilters['sortBy']
  >(sortableColumnIds, 'saleDate', ['status'], 'createdAt');

  const [saleNoParam] = useQueryState('saleNo', parseAsString);
  const [searchParam] = useQueryState('search', parseAsString);
  const [statusParam] = useQueryState('status', parseAsString);

  const search = searchParam || saleNoParam || undefined;
  const statusFilter = parseActiveCancelledStatus(statusParam);

  const { data, isFetching } = useQuery(
    salesQueryOptions({
      page: params.page,
      pageSize: params.perPage,
      search: search || undefined,
      status: statusFilter,
      sortBy,
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
      id: 'customerName',
      accessorKey: 'customerName',
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
        variant: 'text',
        type: 'text',
        priority: 2,
        mobile: 'subtitle'
      },
      enableColumnFilter: false,
      enableSorting: false
    },
    {
      id: 'saleDate',
      accessorKey: 'saleDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.col.date')} />,
      cell: ({ row }) => (
        <span className='font-normal text-foreground'>{formatIsoDate(row.original.saleDate)}</span>
      ),
      meta: {
        label: 'table.col.date',
        variant: 'date',
        priority: 4,
        mobile: 'meta'
      },
      enableColumnFilter: false,
      enableSorting: true
    },
    createDocumentTotalColumn<SaleDTO>({ totalPriority: 3 }),
    createDocumentPaidColumn<SaleDTO>({ paidPriority: 3 }),
    createDocumentOutstandingColumn<SaleDTO>({ outstandingPriority: 2 }),
    createDocumentPayStatusColumn<SaleDTO>(salePayBadge, [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Cancelled', value: 'CANCELLED' }
    ]),
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
      id: 'active',
      label: t('status.active'),
      columnId: 'status',
      value: ['ACTIVE']
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
          onOpenChange={(open) => {
            if (!open) setPeekCancelSale(null);
          }}
        />
      ) : null}
      {peekReturnSale ? (
        <ReturnSaleDialog
          sale={peekReturnSale}
          open
          onOpenChange={(open) => {
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
