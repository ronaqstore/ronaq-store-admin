import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { ConsignmentListFilters } from '@/lib/api/types';
import { compactFilters } from '@/lib/api/compact-filters';
import { listConsignments } from './service';

export const consignmentKeys = {
  all: ['consignments'] as const,
  lists: () => [...consignmentKeys.all, 'list'] as const,
  list: (filters?: ConsignmentListFilters) => [...consignmentKeys.lists(), filters] as const,
  details: () => [...consignmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...consignmentKeys.details(), id] as const
};

export const consignmentsQueryOptions = (filters: ConsignmentListFilters = {}, token?: string) => {
  const compact = compactFilters(filters as Record<string, unknown>) as ConsignmentListFilters;
  return queryOptions({
    queryKey: consignmentKeys.list(compact),
    queryFn: () => listConsignments(compact, token),
    placeholderData: keepPreviousData
  });
};
