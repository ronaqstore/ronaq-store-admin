import { listProducts } from '@/features/products/api/service';
import type { AsyncFacetedFilterConfig } from '@/types/data-table';

export function createProductAsyncFilter(
  queryKeyTail: string
): AsyncFacetedFilterConfig {
  return {
    queryKey: ['products', queryKeyTail],
    searchPlaceholderKey: 'search.products',
    activeOnly: true,
    fetchPage: async ({ page, pageSize, search }) => {
      const res = await listProducts({
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
}
