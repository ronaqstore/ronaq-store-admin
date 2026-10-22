'use client';

import type { ColumnDef, Row } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { Link, useRouter } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RowActionsMenu } from '@/components/common/row-actions-menu';
import {
  ResponsiveDataTable,
  StatusBadge,
  type DetailConfig,
  type MobileItemConfig,
  type QuickFilterChip
} from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { useDataTable } from '@/hooks/use-data-table';
import { Icons } from '@/components/icons';
import { IconPlus } from '@tabler/icons-react';
import { useT } from '@/i18n/use-t';
import {
  DUKAAN_DEFAULT_PAGE_SIZE,
  parseBinaryFacet,
  parseBooleanFacet,
  useDukaanListParams
} from '@/components/data-table/list-params';
import { formatLabel, formatPkr } from '@/lib/dukaan/numbers';
import type { InventoryItemDTO } from '@/lib/api/types';
import type { InventoryRowActionsProps, InventoryTableProps } from '@/types/inventory';
import { inventoryStockQueryOptions } from '../api/queries';
import { TruncateText } from '@/components/common/truncate-text';
import { StockAdjustDialog } from './stock-adjust-dialog';
import {
  INVENTORY_COST_RANGE_RUPEES,
  firstInventoryFilterValue,
  inventoryProductAsyncFilter,
  parseExactQuantity,
  parseInventoryCostRange
} from './inventory-table-filters';

function InventoryRowActions({ item, onAdjust, onViewUnits }: InventoryRowActionsProps) {
  const t = useT();
  const actions = [];
  if (item.trackingType === 'SERIALIZED' && onViewUnits) {
    actions.push({
      label: t('inventory.viewSerializedUnits'),
      icon: Icons.box,
      onClick: () => onViewUnits(item)
    });
  }
  actions.push({
    label: t('common.adjustStock'),
    icon: Icons.adjustments,
    onClick: () => onAdjust(item)
  });
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role='presentation'
      data-slot='action-cell'
    >
      <RowActionsMenu actions={actions} />
    </div>
  );
}

const TRACKING_OPTIONS = [
  { label: 'Quantity', value: 'QUANTITY' },
  { label: 'Serialized', value: 'SERIALIZED' }
];

const LOW_STOCK_OPTIONS = [
  { label: 'Low Stock', value: 'true' },
  { label: 'OK', value: 'false' }
];

export function InventoryTable({ toolbarAction }: InventoryTableProps) {
  const t = useT();
  const router = useRouter();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItemDTO | null>(null);

  const sortableColumnIds = ['name', 'inStock', 'stockValue'];
  const { params, filters, sortBy, sortOrder, getPageCount } = useDukaanListParams<
    'name' | 'inStock' | 'stockValue'
  >(
    sortableColumnIds,
    'name',
    ['productId', 'trackingType', 'lowStock', 'stockValue'],
    'name',
    'asc'
  );

  const [nameParam] = useQueryState('name', parseAsString);
  const [searchParam] = useQueryState('search', parseAsString);
  const [productIdParam] = useQueryState('productId', parseAsString);
  const [trackingTypeParam] = useQueryState('trackingType', parseAsString);
  const [lowStockParam] = useQueryState('lowStock', parseAsString);
  const [inStockParam] = useQueryState('inStock', parseAsString);

  const search = searchParam || nameParam || undefined;

  const productIdFilter =
    firstInventoryFilterValue((filters as Record<string, unknown>).productId) ??
    firstInventoryFilterValue(productIdParam);

  const rawTracking = (filters as Record<string, unknown>).trackingType ?? trackingTypeParam;
  const trackingFilter = parseBinaryFacet<'QUANTITY' | 'SERIALIZED'>(
    rawTracking,
    'QUANTITY',
    'SERIALIZED'
  );

  const rawLowStock = (filters as Record<string, unknown>).lowStock ?? lowStockParam;
  const lowStockFilter = parseBooleanFacet(rawLowStock);
  const costRange = parseInventoryCostRange((filters as Record<string, unknown>).stockValue);
  const quantityFilter = parseExactQuantity(inStockParam);

  const { data, isFetching } = useQuery(
    inventoryStockQueryOptions({
      page: params.page,
      pageSize: params.perPage,
      search: search || undefined,
      productId: productIdFilter,
      sortBy,
      sortOrder,
      trackingType: trackingFilter,
      lowStock: lowStockFilter,
      minStockValue: costRange.minStockValue,
      maxStockValue: costRange.maxStockValue,
      inStock: quantityFilter
    })
  );

  let items = data?.items ?? [];
  const total = data?.total ?? items.length;
  const pageCount = getPageCount(total);

  const handleAdjust = (item: InventoryItemDTO) => {
    setSelectedProduct(item);
    setAdjustOpen(true);
  };

  const columns: ColumnDef<InventoryItemDTO>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      accessorFn: (row) => row.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.col.product')} />
      ),
      cell: ({ row }) => {
        const meta = [row.original.brandName, row.original.categoryName].filter(Boolean).join(' · ');
        return (
          <div className='min-w-0 space-y-0.5'>
            {row.original.trackingType === 'SERIALIZED' ? (
              <Link
                href={`/dashboard/inventory/${row.original.id}`}
                className='block min-w-0 truncate font-normal text-foreground hover:underline hover:text-primary transition-colors'
                title={row.original.name}
                onClick={(e) => e.stopPropagation()}
              >
                {row.original.name}
              </Link>
            ) : (
              <TruncateText className='font-normal text-foreground'>{row.original.name}</TruncateText>
            )}
            <div className='flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
              {meta ? <TruncateText>{meta}</TruncateText> : null}
              {row.original.sku && (
                <Badge variant='outline' className='shrink-0 text-[10px] px-1 py-0 h-4 font-mono'>
                  {row.original.sku}
                </Badge>
              )}
            </div>
          </div>
        );
      },
      meta: {
        label: 'table.col.product',
        placeholderKey: 'search.inventory',
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
      id: 'productId',
      accessorKey: 'id',
      accessorFn: (row) => row.id,
      header: () => null,
      cell: () => null,
      meta: {
        label: 'table.col.product',
        variant: 'select',
        icon: Icons.box,
        asyncOptions: inventoryProductAsyncFilter,
        priority: 2,
        mobile: 'hidden'
      },
      enableColumnFilter: true,
      enableSorting: false,
      enableHiding: true
    },
    {
      id: 'trackingType',
      accessorKey: 'trackingType',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.col.tracking')} />
      ),
      cell: ({ row }) => (
        <Badge
          variant='outline'
          className={
            row.original.trackingType === 'SERIALIZED'
              ? 'border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/10'
              : 'border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10'
          }
        >
          {row.original.trackingType === 'SERIALIZED' ? 'serialized' : 'quantity'}
        </Badge>
      ),
      meta: {
        label: 'table.col.tracking',
        variant: 'select',
        icon: Icons.box,
        options: TRACKING_OPTIONS,
        priority: 2,
        mobile: 'subtitle'
      },
      enableColumnFilter: true,
      enableSorting: false
    },
    {
      id: 'inStock',
      accessorKey: 'inStock',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.col.qty')} />,
      cell: ({ row }) => (
        <span className='font-normal tabular-nums text-foreground'>{row.original.inStock}</span>
      ),
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
      id: 'stockValue',
      accessorKey: 'stockValue',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.col.cost')} />,
      cell: ({ row }) => (
        <span className='font-normal text-foreground'>{formatPkr(row.original.stockValue)}</span>
      ),
      meta: {
        label: 'table.col.cost',
        variant: 'range',
        range: INVENTORY_COST_RANGE_RUPEES,
        unit: 'Rs',
        icon: Icons.cash,
        priority: 2,
        mobile: 'meta'
      },
      enableColumnFilter: true,
      enableSorting: true
    },
    {
      id: 'lowStock',
      accessorKey: 'lowStock',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('inventory.lowStock')} />
      ),
      cell: ({ row }) =>
        row.original.lowStock ? (
          <StatusBadge status='OVERDUE' label={t('inventory.lowStock')} tone='danger' />
        ) : (
          <StatusBadge status='ACTIVE' label='OK' tone='success' />
        ),
      meta: {
        label: 'status.lowStock',
        variant: 'select',
        icon: Icons.warning,
        options: LOW_STOCK_OPTIONS,
        priority: 1,
        mobile: 'badge'
      },
      enableColumnFilter: true,
      enableSorting: false
    },
    {
      id: 'actions',
      size: 48,
      enableSorting: false,
      enableHiding: false,
      meta: { mobile: 'hidden' },
      cell: ({ row }) => (
        <InventoryRowActions
          item={row.original}
          onAdjust={handleAdjust}
          onViewUnits={(item) => router.push(`/dashboard/inventory/${item.id}`)}
        />
      )
    }
  ];

  const inventoryMobileItem: MobileItemConfig<InventoryItemDTO> = {
    leading: 'icon',
    leadingIcon: Icons.box,
    title: (row) => row.name,
    subtitle: (row) => `${formatLabel(row.trackingType)} · ${row.categoryName ?? '—'}`,
    badge: (row) =>
      row.lowStock
        ? { label: 'Low stock', status: 'OVERDUE', tone: 'danger' }
        : { label: 'OK', status: 'ACTIVE', tone: 'success' },
    value: (row) => `${row.inStock} in stock`,
    meta: [(row) => formatPkr(row.stockValue)],
    ariaLabel: (row) => `${row.name}, ${row.inStock} in stock, ${formatPkr(row.stockValue)}`
  };

  const inventoryDetail: DetailConfig<InventoryItemDTO> = {
    mode: 'sheet',
    title: (row) => row.name,
    badge: (row) =>
      row.lowStock
        ? { label: 'Low stock', status: 'OVERDUE', tone: 'danger' }
        : { label: 'In stock OK', status: 'ACTIVE', tone: 'success' },
    value: (row) => `${row.inStock} units · ${formatPkr(row.stockValue)}`,
    sections: (row) => [
      {
        title: 'Product Details',
        fields: [
          { label: 'Product Name', value: row.name },
          { label: 'Category', value: row.categoryName || '—' },
          { label: 'Brand', value: row.brandName || '—' },
          { label: 'SKU', value: row.sku || '—' },
          { label: 'Barcode', value: row.barcode || '—' },
          { label: 'Tracking Type', value: formatLabel(row.trackingType) },
          { label: 'Current Stock', value: `${row.inStock} units` },
          { label: 'Total Stock Value', value: formatPkr(row.stockValue) },
          {
            label: 'Avg Unit Cost',
            value: row.inStock > 0 ? formatPkr(Math.round(row.stockValue / row.inStock)) : '—'
          },
          {
            label: 'Status',
            value: row.lowStock ? (
              <StatusBadge status='OVERDUE' label={t('inventory.lowStock')} tone='danger' />
            ) : (
              <StatusBadge status='ACTIVE' label='OK' tone='success' />
            )
          }
        ]
      },
      ...(row.trackingType === 'SERIALIZED' && row.imeis && row.imeis.length > 0
        ? [
            {
              title: `Serialized Units in Stock (${row.imeis.length})`,
              fields: row.imeis.map((imei, idx) => ({
                label: `Unit #${idx + 1}`,
                value: (
                  <Badge variant='outline' className='font-mono'>
                    {t('inventory.imeiLabel')} {imei}
                  </Badge>
                )
              }))
            }
          ]
        : [])
    ],
    actions: (row) => [
      ...(row.trackingType === 'SERIALIZED'
        ? [
            {
              label: t('inventory.viewSerializedUnits'),
              onClick: () => router.push(`/dashboard/inventory/${row.id}`)
            }
          ]
        : []),
      {
        label: t('common.adjustStock'),
        variant: 'secondary' as const,
        onClick: () => handleAdjust(row)
      }
    ]
  };

  const inventoryQuickFilters: QuickFilterChip[] = [
    { id: 'all', label: t('table.all') },
    {
      id: 'low',
      label: t('status.lowStock'),
      columnId: 'lowStock',
      value: ['true']
    },
    {
      id: 'serialized',
      label: 'Serialized',
      columnId: 'trackingType',
      value: ['SERIALIZED']
    },
    {
      id: 'quantity',
      label: 'Quantity',
      columnId: 'trackingType',
      value: ['QUANTITY']
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
      pagination: { pageIndex: 0, pageSize: DUKAAN_DEFAULT_PAGE_SIZE },
      columnVisibility: { productId: false }
    }
  });

  const handleOpenAdjustStock = () => {
    setSelectedProduct(null);
    setAdjustOpen(true);
  };

  const handleRowClick = (row: Row<InventoryItemDTO>) => {
    if (row.original.trackingType === 'SERIALIZED') {
      router.push(`/dashboard/inventory/${row.original.id}`);
      return true;
    }
    return false;
  };

  return (
    <>
      <ResponsiveDataTable
        table={table}
        onRowClick={handleRowClick}
        toolbarAction={
          toolbarAction ?? (
            <Button type='button' size='sm' onClick={handleOpenAdjustStock}>
              <IconPlus className='me-1.5 h-4 w-4' />
              {t('common.adjustStock')}
            </Button>
          )
        }
        mobileItem={inventoryMobileItem}
        detail={inventoryDetail}
        quickFilters={inventoryQuickFilters}
        isLoading={isFetching}
      />

      {adjustOpen && (
        <StockAdjustDialog
          open={adjustOpen}
          onOpenChange={setAdjustOpen}
          initialProduct={selectedProduct}
        />
      )}
    </>
  );
}
