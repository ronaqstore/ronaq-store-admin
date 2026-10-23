'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parseAsString, useQueryState } from 'nuqs';
import { toast } from 'sonner';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { Badge } from '@/components/ui/badge';
import { PreviewableImage } from '@/components/media/previewable-image';
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
import { useT } from '@/i18n/use-t';
import { t as staticT } from '@/i18n/static-t';
import { AlertModal } from '@/components/modal/alert-modal';
import { useRouter } from '@/i18n/navigation';
import { productsQueryOptions } from '../api/queries';
import { deactivateProduct, reactivateProduct } from '../api/service';
import type { ProductDTO } from '@/lib/api/types';
import { formatPkr } from '@/lib/dukaan/numbers';
import { formatEmpty } from '@/lib/format-empty';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/constants/placeholders';
import {
  DUKAAN_DEFAULT_PAGE_SIZE,
  parseBooleanFacet,
  useDukaanListParams
} from '@/components/data-table/list-params';
import { getActiveStatusQuickFilters } from '@/components/common/party-table-helpers';
import type { ProductsTableProps } from '@/types/products';
import type { EntityStatusConfirm } from '@/types/common';
import { TruncateText } from '@/components/common/truncate-text';
import { ProductCellAction, ProductImagesField } from './products-table-cells';
import {
  SELLING_PRICE_RANGE_RUPEES,
  brandAsyncFilter,
  categoryAsyncFilter,
  firstFilterValue,
  parseExactStockQuantity,
  parseRupeePriceRange
} from './products-table-filters';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { PRODUCT_SYNC_DOMAINS } from '@/lib/query/sync-domains';

function productCoverUrl(row: ProductDTO): string | null {
  return row.imageUrl || row.imageUrls?.[0] || null;
}

export function ProductsTable({ toolbarAction }: ProductsTableProps) {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const [statusConfirm, setStatusConfirm] = useState<EntityStatusConfirm | null>(null);

  const sortableColumnIds = ['name', 'defaultSellingPrice'];
  const { params, filters, sortBy, sortOrder } = useDukaanListParams(
    sortableColumnIds,
    'name',
    ['categoryId', 'brandId', 'isActive', 'isPublished', 'defaultSellingPrice'],
    'name',
    'desc'
  );

  const [stockParam] = useQueryState('quantityOnHand', parseAsString);

  const categoryId = firstFilterValue((filters as Record<string, unknown>).categoryId);
  const brandId = firstFilterValue((filters as Record<string, unknown>).brandId);
  const isActiveFilter = parseBooleanFacet((filters as Record<string, unknown>).isActive);
  const isPublishedFilter = parseBooleanFacet((filters as Record<string, unknown>).isPublished);
  const priceRange = parseRupeePriceRange(
    (filters as Record<string, unknown>).defaultSellingPrice
  );
  const stockFilter = parseExactStockQuantity(
    (filters as Record<string, unknown>).quantityOnHand ?? stockParam
  );

  const { data, isFetching } = useQuery(
    productsQueryOptions({
      page: params.page,
      pageSize: params.perPage,
      search: filters.search,
      categoryId,
      brandId,
      isActive: isActiveFilter,
      isPublished: isPublishedFilter,
      quantityOnHand: stockFilter,
      minSellingPrice: priceRange.minSellingPrice,
      maxSellingPrice: priceRange.maxSellingPrice,
      sortBy: sortBy as 'name' | 'defaultSellingPrice' | undefined,
      sortOrder
    })
  );
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / params.perPage));

  const statusMutation = useMutation({
    mutationFn: async () => {
      if (!statusConfirm) return;
      if (statusConfirm.nextActive) await reactivateProduct(statusConfirm.id);
      else await deactivateProduct(statusConfirm.id);
    },
    onSuccess: () => {
      const message = statusConfirm?.nextActive
        ? t('dukaan.product.productActivated')
        : t('dukaan.product.productDeactivated');
      setStatusConfirm(null);
      invalidateDomains({ queryClient: qc, domains: PRODUCT_SYNC_DOMAINS });
      toastSuccessAfterClose(message);
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const productColumns: ColumnDef<ProductDTO>[] = useMemo(
    () => [
      {
        id: 'image',
        accessorKey: 'imageUrl',
        size: 56,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={staticT('tableColumns.image')} />
        ),
        meta: { label: 'tableColumns.image', type: 'image', priority: 1 },
        enableSorting: false,
        cell: ({ row }) => {
          const cover = productCoverUrl(row.original);
          return (
            <PreviewableImage
              src={cover}
              alt={formatEmpty(row.original.name)}
              className='relative h-10 w-10 overflow-hidden rounded-md border bg-muted'
              imageClassName='object-contain p-0.5'
              sizes='40px'
              fallbackSrc={PLACEHOLDER_PRODUCT_IMAGE}
            />
          );
        }
      },
      {
        id: 'name',
        accessorKey: 'name',
        size: 240,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={staticT('table.col.name')} />
        ),
        meta: {
          label: 'table.col.name',
          placeholderKey: 'table.search' as const,
          variant: 'text',
          icon: Icons.search,
          type: 'text',
          primary: true,
          priority: 1
        },
        enableColumnFilter: true,
        enableSorting: true,
        cell: ({ row }) => {
          const skuLine = row.original.sku
            ? `SKU: ${row.original.sku}`
            : formatEmpty(row.original.brandName);
          return (
            <div className='min-w-0 space-y-0.5'>
              <TruncateText className='font-medium'>{formatEmpty(row.original.name)}</TruncateText>
              <TruncateText className='text-xs text-muted-foreground'>{skuLine}</TruncateText>
            </div>
          );
        }
      },
      {
        id: 'categoryId',
        accessorKey: 'categoryId',
        size: 140,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={staticT('dukaan.product.category')} />
        ),
        meta: {
          label: 'dukaan.product.category',
          variant: 'select',
          icon: Icons.folder,
          asyncOptions: categoryAsyncFilter,
          type: 'text',
          priority: 2
        },
        enableColumnFilter: true,
        enableSorting: false,
        cell: ({ row }) => (
          <TruncateText>{formatEmpty(row.original.categoryName)}</TruncateText>
        )
      },
      {
        id: 'brandId',
        accessorKey: 'brandId',
        size: 120,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={staticT('dukaan.product.brand')} />
        ),
        meta: {
          label: 'dukaan.product.brand',
          variant: 'select',
          icon: Icons.tag,
          asyncOptions: brandAsyncFilter,
          type: 'text',
          priority: 3
        },
        enableColumnFilter: true,
        enableSorting: false,
        cell: ({ row }) => <TruncateText>{formatEmpty(row.original.brandName)}</TruncateText>
      },
      {
        id: 'defaultSellingPrice',
        accessorKey: 'defaultSellingPrice',
        size: 110,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={staticT('dukaan.product.sellingPrice')} />
        ),
        meta: {
          label: 'dukaan.product.sellingPrice',
          type: 'money',
          priority: 2,
          variant: 'range',
          range: SELLING_PRICE_RANGE_RUPEES,
          unit: 'Rs',
          icon: Icons.cash
        },
        enableColumnFilter: true,
        enableSorting: true,
        cell: ({ row }) => formatPkr(row.original.defaultSellingPrice)
      },
      {
        id: 'quantityOnHand',
        accessorKey: 'quantityOnHand',
        size: 72,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={staticT('dukaan.product.stock')} />
        ),
        meta: {
          label: 'dukaan.product.stock',
          type: 'number',
          priority: 2,
          variant: 'number',
          placeholderKey: 'dukaan.product.stock',
          icon: Icons.box
        },
        enableColumnFilter: true,
        cell: ({ row }) => <span>{row.original.quantityOnHand ?? 0}</span>
      },
      {
        id: 'isActive',
        accessorKey: 'isActive',
        size: 110,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={staticT('dukaan.product.status')} />
        ),
        meta: {
          label: 'dukaan.product.status',
          type: 'boolean',
          priority: 2,
          variant: 'select',
          icon: Icons.status,
          options: [
            { label: staticT('status.active'), value: 'true' },
            { label: staticT('status.inactive'), value: 'false' }
          ]
        },
        enableColumnFilter: true,
        cell: ({ row }) => (
          <div className='flex flex-col gap-1'>
            <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
              {row.original.isActive ? staticT('status.active') : staticT('status.inactive')}
            </Badge>
            <span className='text-[10px] text-muted-foreground'>
              {row.original.isPublished
                ? staticT('dukaan.product.published')
                : staticT('dukaan.product.unpublished')}
            </span>
          </div>
        )
      },
      {
        id: 'isPublished',
        accessorKey: 'isPublished',
        size: 0,
        enableHiding: true,
        enableSorting: false,
        header: () => null,
        meta: {
          label: 'dukaan.product.publishStatus',
          type: 'boolean',
          variant: 'select',
          icon: Icons.share,
          options: [
            { label: staticT('dukaan.product.published'), value: 'true' },
            { label: staticT('dukaan.product.unpublished'), value: 'false' }
          ],
          mobile: 'hidden'
        },
        enableColumnFilter: true,
        cell: () => null
      },
      {
        id: 'actions',
        size: 48,
        enableSorting: false,
        enableHiding: false,
        meta: { mobile: 'hidden' },
        cell: ({ row }) => (
          <div className='flex justify-end'>
            <ProductCellAction data={row.original} />
          </div>
        )
      }
    ],
    []
  );

  const productMobileItem: MobileItemConfig<ProductDTO> = useMemo(
    () => ({
      leading: 'thumbnail',
      leadingIcon: Icons.product,
      imageUrl: (row) => productCoverUrl(row),
      title: (row) => row.name,
      subtitle: (row) => row.categoryName || (row.isActive ? t('status.active') : t('status.inactive')),
      badge: (row) => ({
        label: row.isActive ? t('status.active') : t('status.inactive'),
        status: row.isActive ? 'ACTIVE' : 'INACTIVE'
      }),
      value: (row) => formatPkr(row.defaultSellingPrice),
      ariaLabel: (row) =>
        `${row.name}, ${row.isActive ? t('status.active') : t('status.inactive')}`
    }),
    [t]
  );

  const productDetail: DetailConfig<ProductDTO> = useMemo(
    () => ({
      mode: 'sheet',
      title: (row) => row.name,
      badge: (row) => ({
        label: row.isActive ? t('status.active') : t('status.inactive'),
        status: row.isActive ? 'ACTIVE' : 'INACTIVE'
      }),
      value: (row) => formatPkr(row.defaultSellingPrice),
      sections: (row) => [
        {
          title: t('dukaan.product.images'),
          fields: [{ label: t('dukaan.product.images'), value: <ProductImagesField row={row} /> }]
        },
        {
          title: t('dukaan.product.title'),
          fields: [
            { label: t('table.col.name'), value: row.name },
            { label: t('dukaan.product.category'), value: formatEmpty(row.categoryName) },
            { label: t('dukaan.product.brand'), value: formatEmpty(row.brandName) },
            { label: t('dukaan.product.sellingPrice'), value: formatPkr(row.defaultSellingPrice) },
            { label: t('dukaan.product.stock'), value: String(row.quantityOnHand ?? 0) },
            {
              label: t('table.col.status'),
              value: (
                <StatusBadge
                  status={row.isActive ? 'ACTIVE' : 'INACTIVE'}
                  label={row.isActive ? t('status.active') : t('status.inactive')}
                />
              )
            }
          ]
        }
      ],
      actions: (row) => [
        {
          label: t('common.edit'),
          onClick: () => router.push(`/dashboard/products/${row.id}/edit`)
        },
        row.isActive
          ? {
              label: t('common.deactivate'),
              variant: 'destructive' as const,
              onClick: () => setStatusConfirm({ id: row.id, nextActive: false })
            }
          : {
              label: t('common.activate'),
              variant: 'secondary' as const,
              onClick: () => setStatusConfirm({ id: row.id, nextActive: true })
            }
      ]
    }),
    [router, t]
  );

  const { table } = useDataTable({
    data: items,
    columns: productColumns,
    pageCount,
    rowCount: total,
    shallow: true,
    debounceMs: 400,
    initialState: {
      pagination: { pageIndex: 0, pageSize: DUKAAN_DEFAULT_PAGE_SIZE },
      columnVisibility: { isPublished: false }
    }
  });

  const productQuickFilters: QuickFilterChip[] = getActiveStatusQuickFilters(
    t('table.all'),
    t('status.active'),
    t('status.inactive')
  );

  return (
    <>
      <AlertModal
        isOpen={statusConfirm != null}
        onClose={() => setStatusConfirm(null)}
        onConfirm={() => statusMutation.mutate()}
        loading={statusMutation.isPending}
        title={
          statusConfirm?.nextActive
            ? t('dukaan.product.activateTitle')
            : t('dukaan.product.deactivateTitle')
        }
        description={
          statusConfirm?.nextActive
            ? t('dukaan.product.activateDescription')
            : t('dukaan.product.deactivateDescription')
        }
        confirmLabel={
          statusConfirm?.nextActive ? t('common.activate') : t('common.deactivate')
        }
        confirmVariant={statusConfirm?.nextActive ? 'default' : 'destructive'}
      />
      <ResponsiveDataTable
        table={table}
        toolbarAction={toolbarAction}
        mobileItem={productMobileItem}
        detail={productDetail}
        quickFilters={productQuickFilters}
        isLoading={isFetching}
      />
    </>
  );
}
