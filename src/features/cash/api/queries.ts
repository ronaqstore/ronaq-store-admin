import { queryOptions } from '@tanstack/react-query';
import type { CashMovementQueryFilter } from '@/types/cash';
import type { PaymentsListFilters } from '@/types';
import { listCashMovements } from './service';

export const cashKeys = {
  all: ['cash'] as const,
  movements: (filters?: CashMovementQueryFilter) =>
    [...cashKeys.all, 'movements', filters] as const,
  payments: (filters?: PaymentsListFilters) => [...cashKeys.all, 'payments', filters] as const,
  openingStatus: () => [...cashKeys.all, 'opening-status'] as const
};

export const cashMovementsQueryOptions = (filters: CashMovementQueryFilter = {}, token?: string) =>
  queryOptions({
    queryKey: cashKeys.movements(filters),
    queryFn: () => listCashMovements(filters, token)
  });

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
