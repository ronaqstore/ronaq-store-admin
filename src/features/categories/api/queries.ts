import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { CategoryListFilters } from '@/types';
import { compactFilters } from '@/lib/api/compact-filters';
import { listCategories } from './service';

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters?: CategoryListFilters) => [...categoryKeys.lists(), filters] as const
};

export const categoriesQueryOptions = (filters: CategoryListFilters = {}, token?: string) => {
  const compact = compactFilters(filters as Record<string, unknown>) as CategoryListFilters;
  return queryOptions({
    queryKey: categoryKeys.list(compact),
    queryFn: () => listCategories(compact, token),
    placeholderData: keepPreviousData
  });
};
