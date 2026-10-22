import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { CashMovementQueryFilter } from '@/types/cash';
import type { PaymentsListFilters } from '@/types';
import { compactFilters } from '@/lib/api/compact-filters';
import { listCashMovements } from './service';

export const cashKeys = {
  all: ['cash'] as const,
  movements: (filters?: CashMovementQueryFilter) =>
    [...cashKeys.all, 'movements', filters] as const,
  payments: (filters?: PaymentsListFilters) => [...cashKeys.all, 'payments', filters] as const,
  openingStatus: () => [...cashKeys.all, 'opening-status'] as const
};

export const cashMovementsQueryOptions = (
  filters: CashMovementQueryFilter = {},
  token?: string
) => {
  const compact = compactFilters(filters as Record<string, unknown>) as CashMovementQueryFilter;
  return queryOptions({
    queryKey: cashKeys.movements(compact),
    queryFn: () => listCashMovements(compact, token),
    placeholderData: keepPreviousData
  });
};

export const cashQueryOptions = (filters: CashMovementQueryFilter = {}, token?: string) =>
  cashMovementsQueryOptions(filters, token);

export const cashOpeningStatusQueryOptions = (token?: string) =>
  queryOptions({
    queryKey: cashKeys.openingStatus(),
    queryFn: async () => {
      const res = await listCashMovements(
        { type: 'OPENING_CASH', page: 1, pageSize: 1 },
        token
      );
      return { hasOpening: (res.total ?? res.items.length) > 0 };
    },
    staleTime: 30_000
  });
