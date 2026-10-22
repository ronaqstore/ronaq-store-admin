import { listCustomers } from '@/features/customers/api/service';
import type { AsyncFacetedFilterConfig } from '@/types/data-table';

export const customerAsyncFilter: AsyncFacetedFilterConfig = {
  queryKey: ['customers', 'sale-filter'],
  searchPlaceholderKey: 'search.customers',
  activeOnly: true,
  fetchPage: async ({ page, pageSize, search }) => {
    const res = await listCustomers({
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
