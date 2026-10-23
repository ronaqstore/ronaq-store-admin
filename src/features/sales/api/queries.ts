import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { SalesListFilters } from '@/types';
import { compactFilters } from '@/lib/api/compact-filters';
import { getCancelImpact, getSale, listSales } from './service';

export const saleKeys = {
  all: ['sales'] as const,
  lists: () => [...saleKeys.all, 'list'] as const,
  list: (filters?: SalesListFilters) => [...saleKeys.lists(), filters] as const,
  details: () => [...saleKeys.all, 'detail'] as const,
  detail: (id: string) => [...saleKeys.details(), id] as const,
  cancelImpacts: () => [...saleKeys.all, 'cancelImpact'] as const,
  cancelImpact: (id: string) => [...saleKeys.cancelImpacts(), id] as const
};

export const salesQueryOptions = (filters: SalesListFilters = {}, token?: string) => {
  const compact = compactFilters(filters as Record<string, unknown>) as SalesListFilters;
  return queryOptions({
    queryKey: saleKeys.list(compact),
    queryFn: () => listSales(compact, token),
    placeholderData: keepPreviousData
  });
};

export const saleQueryOptions = (id: string, token?: string) =>
  queryOptions({
    queryKey: saleKeys.detail(id),
    queryFn: () => getSale(id, token)
  });

export const cancelImpactQueryOptions = (id: string, token?: string) =>
  queryOptions({
    queryKey: saleKeys.cancelImpact(id),
    queryFn: () => getCancelImpact(id, token),
    enabled: !!id
  });
