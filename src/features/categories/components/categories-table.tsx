'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ResponsiveDataTable } from '@/components/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import { t } from '@/i18n';
import { SimpleEntityCellAction } from '@/components/common/simple-entity-cell-action';
import { categoriesQueryOptions, categoryKeys } from '../api/queries';
import { deactivateCategory, reactivateCategory } from '../api/service';
import type { CategoryDTO } from '@/lib/api/types';
import type { CategoryCellActionProps, CategoriesTableProps } from '@/types';
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
import { CategoryDialog } from './category-dialog';

function CategoryCellAction({ data }: CategoryCellActionProps) {
  const t = useT();

  return (
    <SimpleEntityCellAction
      id={data.id}
      isActive={data.isActive}
      deactivateTitle={t('dukaan.category.deactivateTitle')}
      deactivateDescription={t('dukaan.category.deactivateDescription')}
      deactivateSuccess={t('dukaan.category.deactivated')}
      activateTitle={t('dukaan.category.activateTitle')}
      activateDescription={t('dukaan.category.activateDescription')}
      activateSuccess={t('dukaan.category.activated')}
      onDeactivate={deactivateCategory}
      onActivate={reactivateCategory}
      invalidateQueryKey={categoryKeys.all}
      renderDialog={(open, onOpenChange) => (
        <CategoryDialog open={open} onOpenChange={onOpenChange} category={data} />
      )}
    />
  );
}

const categoryColumns: ColumnDef<CategoryDTO>[] = [
  createPartyNameColumn<CategoryDTO>({ placeholderKey: 'search.categories' }),
  createPartyIsActiveColumn<CategoryDTO>(),
  {
    id: 'actions',
    size: 48,
    enableSorting: false,
    enableHiding: false,
    meta: { mobile: 'hidden' },
    cell: ({ row }) => (
      <div className='flex justify-end'>
        <CategoryCellAction data={row.original} />
      </div>
    )
  }
];

const categoryMobileItem = buildSimpleEntityMobileItem<CategoryDTO>(Icons.folder);
const categoryDetail = buildSimpleEntityDetail<CategoryDTO>(t('table.col.category'));

export function CategoriesTable({ toolbarAction }: CategoriesTableProps) {
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
    categoriesQueryOptions({
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
    columns: categoryColumns,
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
      mobileItem={categoryMobileItem}
      detail={categoryDetail}
      isLoading={isFetching}
    />
  );
}
