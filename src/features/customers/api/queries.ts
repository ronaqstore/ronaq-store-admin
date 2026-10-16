import { queryOptions } from '@tanstack/react-query';
import type { CustomerListFilters } from '@/types';
import { listCustomers } from './service';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters?: CustomerListFilters) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const
};

export const customersQueryOptions = (filters: CustomerListFilters = {}, token?: string) =>
  queryOptions({
    queryKey: customerKeys.list(filters),
    queryFn: () => listCustomers(filters, token)
  });
