'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import { PreviewableImage } from '@/components/media/previewable-image';
import {
  ResponsiveDataTable,
  StatusBadge,
  type DetailConfig,
  type MobileItemConfig
} from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { useDataTable } from '@/hooks/use-data-table';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import { t as staticT } from '@/i18n/static-t';
import { SimpleEntityCellAction } from '@/components/common/simple-entity-cell-action';
import { productsQueryOptions, productsQueryKeys } from '../api/queries';
import { deactivateProduct, reactivateProduct } from '../api/service';
import { listCategories } from '@/features/categories/api/service';
import { listBrands } from '@/features/brands/api/service';
import type { ProductDTO } from '@/lib/api/types';
import { formatPkr } from '@/lib/dukaan/numbers';
import { formatEmpty } from '@/lib/format-empty';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/constants/placeholders';
import { DUKAAN_DEFAULT_PAGE_SIZE, useDukaanListParams } from '@/components/data-table/list-params';
import type {
  ProductCellActionProps,
  ProductImagesFieldProps,
  ProductsTableProps
} from '@/types/products';
import type { AsyncFacetedFilterConfig } from '@/types/data-table';

const categoryAsyncFilter: AsyncFacetedFilterConfig = {
  queryKey: ['categories', 'product-filter'],
  searchPlaceholderKey: 'dukaan.product.searchCategories',
  activeOnly: true,
  fetchPage: async ({ page, pageSize, search }) => {
    const res = await listCategories({
      page,
      pageSize,
      search,
      isActive: true,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    return {
      items: res.items,
      total: res.total,
      page: res.page,
      pageSize: res.pageSize
    };
  }
};

const brandAsyncFilter: AsyncFacetedFilterConfig = {
  queryKey: ['brands', 'product-filter'],
  searchPlaceholderKey: 'dukaan.product.searchBrands',
  activeOnly: true,
  fetchPage: async ({ page, pageSize, search }) => {
    const res = await listBrands({
      page,
      pageSize,
      search,
      isActive: true,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    return {
      items: res.items,
      total: res.total,
      page: res.page,
      pageSize: res.pageSize
    };
  }
};

const ProductDialog = dynamic(
  () => import('./product-dialog').then((mod) => mod.ProductDialog),
  { ssr: false }
);

function ProductCellAction({ data }: ProductCellActionProps) {
  const t = useT();

  return (
    <SimpleEntityCellAction
      id={data.id}
      isActive={data.isActive}
      deactivateTitle={t('dukaan.product.deactivateTitle')}
      deactivateDescription={t('dukaan.product.deactivateDescription')}
      deactivateSuccess={t('dukaan.product.productDeactivated')}
      activateTitle={t('dukaan.product.activateTitle')}
      activateDescription={t('dukaan.product.activateDescription')}
      activateSuccess={t('dukaan.product.productActivated')}
      onDeactivate={deactivateProduct}
      onActivate={reactivateProduct}
      invalidateQueryKey={productsQueryKeys.all}
      renderDialog={(open, onOpenChange) => (
        <ProductDialog open={open} onOpenChange={onOpenChange} product={data} />
      )}
    />
  );
}

const productColumns: ColumnDef<ProductDTO>[] = [
    {
      id: 'image',
      accessorKey: 'imageUrl',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={staticT('tableColumns.image')} />
      ),
      meta: { label: 'tableColumns.image', type: 'image', priority: 1 },
      enableSorting: false,
      cell: ({ row }) => {
        const cover = row.original.imageUrl || row.original.imageUrls?.[0] || null;
        return (
          <PreviewableImage
            src={cover}
            alt={formatEmpty(row.original.name)}
            className='relative h-10 w-10 overflow-hidden rounded-md border bg-muted'
            imageClassName='object-cover'
            sizes='40px'
            fallbackSrc={PLACEHOLDER_PRODUCT_IMAGE}
          />
        );
      }
    },
    {
      id: 'name',
      accessorKey: 'name',
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
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <span className='font-medium'>{formatEmpty(row.original.name)}</span>
          <span className='text-xs text-muted-foreground'>
            {row.original.sku
              ? `SKU: ${row.original.sku}`
              : formatEmpty(row.original.brandName)}
          </span>
        </div>
      )
    },
    {
      id: 'categoryId',
      accessorKey: 'categoryId',
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
      cell: ({ row }) => <span>{formatEmpty(row.original.categoryName)}</span>
    },
    {
      id: 'brandId',
      accessorKey: 'brandId',
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
      cell: ({ row }) => <span>{formatEmpty(row.original.brandName)}</span>
    },
    {
      id: 'defaultSellingPrice',
      accessorKey: 'defaultSellingPrice',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={staticT('dukaan.product.sellingPrice')} />
      ),
      meta: { label: 'dukaan.product.sellingPrice', type: 'money', priority: 2 },
      cell: ({ row }) => formatPkr(row.original.defaultSellingPrice)
    },
    {
      id: 'quantityOnHand',
      accessorKey: 'quantityOnHand',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={staticT('dukaan.product.stock')} />
      ),
      meta: { label: 'dukaan.product.stock', type: 'number', priority: 2 },
      cell: ({ row }) => <span>{row.original.quantityOnHand ?? 0}</span>
    },
    {
      id: 'isActive',
      accessorKey: 'isActive',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={staticT('table.col.status')} />
      ),
      meta: { label: 'table.col.status', type: 'boolean', priority: 2 },
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
  ];

const productMobileItem: MobileItemConfig<ProductDTO> = {
  leading: 'thumbnail',
  leadingIcon: Icons.product,
  title: (row) => row.name,
  subtitle: (row) => row.categoryName || (row.isActive ? 'Active' : 'Inactive'),
  badge: (row) => ({
    label: row.isActive ? 'Active' : 'Inactive',
    status: row.isActive ? 'ACTIVE' : 'INACTIVE'
  }),
  value: (row) => formatPkr(row.defaultSellingPrice),
  ariaLabel: (row) => `${row.name}, ${row.isActive ? 'Active' : 'Inactive'}`
};

function ProductImagesField({ row }: ProductImagesFieldProps) {
  const t = useT();
  const urls =
    row.imageUrls?.length ?
      row.imageUrls
    : row.imageUrl ?
      [row.imageUrl]
    : [];

  if (urls.length === 0) {
    return (
      <span className='text-muted-foreground'>{t('dukaan.product.noImages')}</span>
    );
  }

  return (
    <div className='grid grid-cols-3 gap-2'>
      {urls.map((url, index) => (
        <PreviewableImage
          key={`${url}-${index}`}
          src={url}
          alt={`${formatEmpty(row.name)} ${index + 1}`}
          className='relative aspect-square overflow-hidden rounded-lg border bg-muted'
          imageClassName='object-cover'
          sizes='120px'
          fallbackSrc={PLACEHOLDER_PRODUCT_IMAGE}
        />
      ))}
    </div>
  );
}

const productDetail: DetailConfig<ProductDTO> = {
  mode: 'sheet',
  title: (row) => row.name,
  badge: (row) => ({
    label: row.isActive ? 'Active' : 'Inactive',
    status: row.isActive ? 'ACTIVE' : 'INACTIVE'
  }),
  value: (row) => formatPkr(row.defaultSellingPrice),
  sections: (row) => [
    {
      title: staticT('dukaan.product.images'),
      fields: [{ label: staticT('dukaan.product.images'), value: <ProductImagesField row={row} /> }]
    },
    {
      title: 'Product Details',
      fields: [
        { label: 'Name', value: row.name },
        { label: 'Category', value: formatEmpty(row.categoryName) },
        { label: 'Brand', value: formatEmpty(row.brandName) },
        { label: 'Selling Price', value: formatPkr(row.defaultSellingPrice) },
        { label: 'Stock', value: String(row.quantityOnHand ?? 0) },
        {
          label: 'Status',
          value: (
            <StatusBadge
              status={row.isActive ? 'ACTIVE' : 'INACTIVE'}
              label={row.isActive ? 'Active' : 'Inactive'}
            />
          )
        }
      ]
    }
  ]
};

function firstFilterValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  if (typeof value === 'string' && value.trim()) return value.split(',')[0]?.trim() || undefined;
  return undefined;
}

export function ProductsTable({ toolbarAction }: ProductsTableProps) {
  const sortableColumnIds = ['name', 'createdAt', 'updatedAt', 'defaultSellingPrice'];
  const { params, filters, sortBy, sortOrder } = useDukaanListParams(sortableColumnIds, 'name', [
    'categoryId',
    'brandId'
  ]);

  const categoryId = firstFilterValue((filters as Record<string, unknown>).categoryId);
  const brandId = firstFilterValue((filters as Record<string, unknown>).brandId);

  const { data } = useSuspenseQuery(
    productsQueryOptions({
      page: params.page,
      pageSize: params.perPage,
      search: filters.search,
      categoryId,
      brandId,
      sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt' | 'defaultSellingPrice' | undefined,
      sortOrder
    })
  );
  const pageCount = Math.max(1, Math.ceil(data.total / params.perPage));
  const { table } = useDataTable({
    data: data.items,
    columns: productColumns,
    pageCount,
    rowCount: data.total,
    shallow: true,
    debounceMs: 400,
    initialState: {
      pagination: { pageIndex: 0, pageSize: DUKAAN_DEFAULT_PAGE_SIZE }
    }
  });

  return (
    <ResponsiveDataTable
      table={table}
      toolbarAction={toolbarAction}
      mobileItem={productMobileItem}
      detail={productDetail}
    />
  );
}
