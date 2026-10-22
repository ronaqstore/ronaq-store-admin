import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { BrandListFilters } from '@/types';
import { compactFilters } from '@/lib/api/compact-filters';
import { listBrands } from './service';

export const brandKeys = {
  all: ['brands'] as const,
  lists: () => [...brandKeys.all, 'list'] as const,
  list: (filters?: BrandListFilters) => [...brandKeys.lists(), filters] as const
};

export const brandsQueryOptions = (filters: BrandListFilters = {}, token?: string) => {
  const compact = compactFilters(filters as Record<string, unknown>) as BrandListFilters;
  return queryOptions({
    queryKey: brandKeys.list(compact),
    queryFn: () => listBrands(compact, token),
    placeholderData: keepPreviousData
  });
};
