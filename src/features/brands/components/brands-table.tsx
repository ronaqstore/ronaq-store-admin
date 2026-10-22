'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ResponsiveDataTable } from '@/components/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import { t } from '@/i18n';
import { SimpleEntityCellAction } from '@/components/common/simple-entity-cell-action';
import { brandsQueryOptions, brandKeys } from '../api/queries';
import { deactivateBrand, reactivateBrand } from '../api/service';
import type { BrandDTO } from '@/lib/api/types';
import type { BrandCellActionProps, BrandsTableProps } from '@/types';
import {
  createPartyNameColumn,
  createPartyIsActiveColumn
} from '@/components/common/party-table-helpers';
import {
  buildSimpleEntityMobileItem,
  buildSimpleEntityDetail
} from '@/components/common/entity-builders';
import {
  DUKAAN_DEFAULT_PAGE_SIZE,
  parseBooleanFacet,
  useDukaanListParams
} from '@/components/data-table/list-params';
import { useQueryState, parseAsString } from 'nuqs';
import { BrandDialog } from './brand-dialog';

function BrandCellAction({ data }: BrandCellActionProps) {
  const t = useT();

  return (
    <SimpleEntityCellAction
      id={data.id}
      isActive={data.isActive}
      deactivateTitle={t('dukaan.brand.deactivateTitle')}
      deactivateDescription={t('dukaan.brand.deactivateDescription')}
      deactivateSuccess={t('dukaan.brand.deactivated')}
      activateTitle={t('dukaan.brand.activateTitle')}
      activateDescription={t('dukaan.brand.activateDescription')}
      activateSuccess={t('dukaan.brand.activated')}
      onDeactivate={deactivateBrand}
      onActivate={reactivateBrand}
      invalidateQueryKey={brandKeys.all}
      renderDialog={(open, onOpenChange) => (
        <BrandDialog open={open} onOpenChange={onOpenChange} brand={data} />
      )}
    />
  );
}

const brandColumns: ColumnDef<BrandDTO>[] = [
  createPartyNameColumn<BrandDTO>({ placeholderKey: 'search.brands' }),
  createPartyIsActiveColumn<BrandDTO>(),
  {
    id: 'actions',
    size: 48,
    enableSorting: false,
    enableHiding: false,
    meta: { mobile: 'hidden' },
    cell: ({ row }) => (
      <div className='flex justify-end'>
        <BrandCellAction data={row.original} />
      </div>
    )
  }
];

const brandMobileItem = buildSimpleEntityMobileItem<BrandDTO>(Icons.tag);
const brandDetail = buildSimpleEntityDetail<BrandDTO>(t('table.col.brand'));

export function BrandsTable({ toolbarAction }: BrandsTableProps) {
  const sortableColumnIds = ['name', 'createdAt', 'updatedAt'];
  const { params, filters, sortBy, sortOrder } = useDukaanListParams(
    sortableColumnIds,
    'name',
    ['isActive'],
    'name',
    'asc'
  );
  const [isActiveParam] = useQueryState('isActive', parseAsString);
  const isActiveFilter = parseBooleanFacet(
    (filters as Record<string, unknown>).isActive ?? isActiveParam
  );
  const { data, isFetching } = useQuery(
    brandsQueryOptions({
      page: params.page,
      pageSize: params.perPage,
      search: filters.search,
      isActive: isActiveFilter,
      sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt' | undefined,
      sortOrder
    })
  );
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / params.perPage));
  const { table } = useDataTable({
    data: items,
    columns: brandColumns,
    pageCount,
    rowCount: total,
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
      mobileItem={brandMobileItem}
      detail={brandDetail}
      isLoading={isFetching}
    />
  );
}
