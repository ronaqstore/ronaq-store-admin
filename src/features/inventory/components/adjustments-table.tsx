'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ResponsiveDataTable,
  type DetailConfig,
  type MobileItemConfig,
  type QuickFilterChip
} from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { useDataTable } from '@/hooks/use-data-table';
import { Icons } from '@/components/icons';
import { IconPlus } from '@tabler/icons-react';
import { useT } from '@/i18n/use-t';
import { DUKAAN_DEFAULT_PAGE_SIZE, useDukaanListParams } from '@/components/data-table/list-params';
import { formatIsoDate } from '@/lib/dates';
import { formatLabel } from '@/lib/dukaan/numbers';
import type { InventoryAdjustmentDTO } from '@/lib/api/types';
import type {
  AdjustmentsTableProps,
  InventoryMovementTypeFilter
} from '@/types/inventory';
import { inventoryAdjustmentsQueryOptions } from '../api/queries';
import { StockAdjustDialog } from './stock-adjust-dialog';
import {
  firstAdjustmentFilterValue,
  parseExactQuantityChange,
  productAsyncFilter
} from './adjustments-table-filters';

const MANUAL_TYPE_OPTIONS = [
  { label: 'Adjustment', value: 'ADJUSTMENT' },
  { label: 'Damaged', value: 'DAMAGED' },
  { label: 'Lost', value: 'LOST' }
];

const ALL_TYPE_OPTIONS = [
  ...MANUAL_TYPE_OPTIONS,
  { label: 'Purchase', value: 'PURCHASE' },
  { label: 'Sale', value: 'SALE' },
  { label: 'Sale cancel', value: 'SALE_CANCEL' },
  { label: 'Purchase cancel', value: 'PURCHASE_CANCEL' },
  { label: 'Customer return', value: 'CUSTOMER_RETURN' }
];

const ALL_TYPE_VALUES = new Set(ALL_TYPE_OPTIONS.map((o) => o.value));

function movementTypeBadgeClass(type: string): string {
  switch (type) {
    case 'ADJUSTMENT':
      return 'border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10';
    case 'DAMAGED':
      return 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10';
    case 'LOST':
      return 'border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10';
    case 'PURCHASE':
    case 'CUSTOMER_RETURN':
    case 'SALE_CANCEL':
      return 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
    case 'SALE':
    case 'PURCHASE_CANCEL':
      return 'border-violet-500/40 text-violet-600 dark:text-violet-400 bg-violet-500/10';
    default:
      return 'border-border text-foreground bg-muted/40';
  }
}

export function AdjustmentsTable({
  toolbarAction,
  mode = 'adjustments'
}: AdjustmentsTableProps) {
  const t = useT();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const isMovements = mode === 'movements';
  const typeOptions = isMovements ? ALL_TYPE_OPTIONS : MANUAL_TYPE_OPTIONS;

  const sortableColumnIds = ['createdAt', 'quantityChange'];
  const { params, filters, sortBy, sortOrder, getPageCount } = useDukaanListParams<
    'createdAt' | 'quantityChange'
  >(sortableColumnIds, 'createdAt', ['type', 'productId'], 'createdAt', 'desc');

  const [typeParam] = useQueryState('type', parseAsString);
  const [productIdParam] = useQueryState('productId', parseAsString);
  const [quantityChangeParam] = useQueryState('quantityChange', parseAsString);
  const [reasonParam] = useQueryState('reason', parseAsString);

  const rawType = (filters as Record<string, unknown>).type ?? typeParam;
  let typeFilter: InventoryMovementTypeFilter | undefined;
  if (rawType) {
    const arr = Array.isArray(rawType)
      ? (rawType as string[])
      : typeof rawType === 'string'
        ? rawType.split(',')
        : [];
    const candidate = arr.length === 1 ? arr[0] : undefined;
    if (candidate && ALL_TYPE_VALUES.has(candidate)) {
      typeFilter = candidate as InventoryMovementTypeFilter;
    }
  }

  const productIdFilter =
    firstAdjustmentFilterValue((filters as Record<string, unknown>).productId) ??
    firstAdjustmentFilterValue(productIdParam);
  const quantityChangeFilter = parseExactQuantityChange(
    (filters as Record<string, unknown>).quantityChange ?? quantityChangeParam
  );
  const reasonFilter = reasonParam?.trim() || undefined;

  const { data, isFetching } = useQuery(
    inventoryAdjustmentsQueryOptions({
      page: params.page,
      pageSize: params.perPage,
      productId: productIdFilter,
      type: typeFilter,
      quantityChange: quantityChangeFilter,
      reason: reasonFilter,
      scope: isMovements ? 'all' : 'manual',
      sortBy,
      sortOrder
    })
  );

  const items = data?.items ?? [];
  const total = data?.total ?? items.length;
  const pageCount = getPageCount(total);

  const columns: ColumnDef<InventoryAdjustmentDTO>[] = [
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.col.date')} />,
      cell: ({ row }) => (
        <span className='font-normal text-foreground'>{formatIsoDate(row.original.createdAt)}</span>
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
      id: 'productId',
      accessorKey: 'productId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.col.product')} />
      ),
      cell: ({ row }) => (
        <div className='flex flex-col gap-0.5'>
          <span className='font-normal text-foreground'>{row.original.productName}</span>
          {row.original.imei && (
            <span className='font-mono text-xs text-muted-foreground'>
              {t('inventory.imeiLabel')} {row.original.imei}
            </span>
          )}
        </div>
      ),
      meta: {
        label: 'table.col.product',
        variant: 'select',
        icon: Icons.box,
        asyncOptions: productAsyncFilter,
        primary: true,
        priority: 1,
        mobile: 'title'
      },
      enableColumnFilter: true,
      enableSorting: false
    },
    {
      id: 'type',
      accessorKey: 'type',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.col.type')} />,
      cell: ({ row }) => (
        <Badge variant='outline' className={movementTypeBadgeClass(row.original.type)}>
          {formatLabel(row.original.type)}
        </Badge>
      ),
      meta: {
        label: 'table.col.type',
        variant: 'select',
        icon: Icons.adjustments,
        options: typeOptions,
        priority: 2,
        mobile: 'badge'
      },
      enableColumnFilter: true,
      enableSorting: false
    },
    {
      id: 'quantityChange',
      accessorKey: 'quantityChange',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.col.qtyDelta')} />
      ),
      cell: ({ row }) => {
        const change = row.original.quantityChange;
        const isPositive = change > 0;
        return (
          <span
            className={
              isPositive
                ? 'font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums'
                : 'font-semibold text-rose-600 dark:text-rose-400 tabular-nums'
            }
          >
            {isPositive ? `+${change}` : change}
          </span>
        );
      },
      meta: {
        label: 'table.col.qty',
        variant: 'number',
        placeholderKey: 'table.col.qty',
        icon: Icons.box,
        priority: 1,
        mobile: 'value'
      },
      enableColumnFilter: true,
      enableSorting: true
    },
    {
      id: 'reason',
      accessorKey: 'reason',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.col.reason')} />
      ),
      cell: ({ row }) => (
        <span className='font-normal text-foreground truncate max-w-xs block'>
          {row.original.reason || '—'}
        </span>
      ),
      meta: {
        label: 'table.col.reason',
        placeholderKey: 'table.col.reason',
        variant: 'text',
        icon: Icons.search,
        type: 'text',
        priority: 3,
        mobile: 'subtitle'
      },
      enableColumnFilter: true,
      enableSorting: false
    }
  ];

  const mobileItem: MobileItemConfig<InventoryAdjustmentDTO> = {
    leading: 'icon',
    leadingIcon: Icons.adjustments,
    title: (row) => row.productName,
    subtitle: (row) => row.reason || formatLabel(row.type),
    badge: (row) => ({
      label: formatLabel(row.type),
      status: row.type === 'ADJUSTMENT' ? 'ACTIVE' : 'OVERDUE'
    }),
    value: (row) => (row.quantityChange > 0 ? `+${row.quantityChange}` : `${row.quantityChange}`),
    meta: [(row) => formatIsoDate(row.createdAt)],
    ariaLabel: (row) => `${row.productName}, ${row.type}, ${row.quantityChange}`
  };

  const detail: DetailConfig<InventoryAdjustmentDTO> = {
    mode: 'sheet',
    title: (row) => row.productName,
    badge: (row) => ({
      label: formatLabel(row.type),
      status: row.type === 'ADJUSTMENT' ? 'ACTIVE' : 'OVERDUE'
    }),
    value: (row) =>
      row.quantityChange > 0 ? `+${row.quantityChange} units` : `${row.quantityChange} units`,
    sections: (row) => [
      {
        title: 'Adjustment Details',
        fields: [
          { label: 'Product', value: row.productName },
          { label: 'Date', value: formatIsoDate(row.createdAt) },
          { label: 'Type', value: formatLabel(row.type) },
          {
            label: 'Quantity Change',
            value: row.quantityChange > 0 ? `+${row.quantityChange}` : `${row.quantityChange}`
          },
          ...(row.imei ? [{ label: 'IMEI', value: row.imei }] : []),
          { label: 'Reason', value: row.reason || '—' }
        ]
      }
    ]
  };

  const quickFilters: QuickFilterChip[] = isMovements
    ? [
        { id: 'all', label: t('table.all') },
        {
          id: 'purchase',
          label: 'Purchase',
          columnId: 'type',
          value: ['PURCHASE']
        },
        {
          id: 'sale',
          label: 'Sale',
          columnId: 'type',
          value: ['SALE']
        },
        {
          id: 'adjustment',
          label: 'Adjustment',
          columnId: 'type',
          value: ['ADJUSTMENT']
        },
        {
          id: 'damaged',
          label: 'Damaged',
          columnId: 'type',
          value: ['DAMAGED']
        },
        {
          id: 'lost',
          label: 'Lost',
          columnId: 'type',
          value: ['LOST']
        }
      ]
    : [
        { id: 'all', label: t('table.all') },
        {
          id: 'adjustment',
          label: 'Adjustment',
          columnId: 'type',
          value: ['ADJUSTMENT']
        },
        {
          id: 'damaged',
          label: 'Damaged',
          columnId: 'type',
          value: ['DAMAGED']
        },
        {
          id: 'lost',
          label: 'Lost',
          columnId: 'type',
          value: ['LOST']
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

  const resolvedToolbar =
    toolbarAction !== undefined
      ? toolbarAction
      : isMovements
        ? null
        : (
            <Button type='button' size='sm' onClick={() => setAdjustOpen(true)}>
              <IconPlus className='me-1.5 h-4 w-4' />
              {t('common.adjustStock')}
            </Button>
          );

  return (
    <>
      <ResponsiveDataTable
        table={table}
        toolbarAction={resolvedToolbar}
        mobileItem={mobileItem}
        detail={detail}
        quickFilters={quickFilters}
        isLoading={isFetching}
      />

      {!isMovements && adjustOpen ? (
        <StockAdjustDialog open={adjustOpen} onOpenChange={setAdjustOpen} />
      ) : null}
    </>
  );
}
