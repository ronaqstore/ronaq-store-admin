import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { listSuppliers } from './service';
import type { SupplierListFilters } from '@/types';
import { compactFilters } from '@/lib/api/compact-filters';

export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (filters?: SupplierListFilters) => [...supplierKeys.lists(), filters] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: string) => [...supplierKeys.details(), id] as const
};

export const suppliersQueryOptions = (filters: SupplierListFilters = {}, token?: string) => {
  const compact = compactFilters(filters as Record<string, unknown>) as SupplierListFilters;
  return queryOptions({
    queryKey: supplierKeys.list(compact),
    queryFn: () => listSuppliers(compact, token),
    placeholderData: keepPreviousData
  });
};
