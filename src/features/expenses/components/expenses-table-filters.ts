import { listExpenseCategories } from '../api/service';
import type { AsyncFacetedFilterConfig } from '@/types/data-table';

export const expenseCategoryAsyncFilter: AsyncFacetedFilterConfig = {
  queryKey: ['expense-categories', 'expense-filter'],
  searchPlaceholderKey: 'search.expenses',
  activeOnly: true,
  fetchPage: async ({ page, pageSize, search }) => {
    const res = await listExpenseCategories({
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
