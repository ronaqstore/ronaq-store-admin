import { listCategories } from '@/features/categories/api/service';
import { listBrands } from '@/features/brands/api/service';
import type { PickerFetchFilters } from '@/types';

export async function fetchCategorySelectPage(filters: PickerFetchFilters) {
  const res = await listCategories({
    page: filters.page,
    pageSize: filters.pageSize ?? filters.limit ?? 20,
    search: filters.search,
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  return {
    items: res.items,
    total: res.total,
    page: res.page,
    limit: res.pageSize
  };
}

export async function fetchBrandSelectPage(filters: PickerFetchFilters) {
  const res = await listBrands({
    page: filters.page,
    pageSize: filters.pageSize ?? filters.limit ?? 20,
    search: filters.search,
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  return {
    items: res.items,
    total: res.total,
    page: res.page,
    limit: res.pageSize
  };
}
