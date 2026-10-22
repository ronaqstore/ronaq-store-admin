import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { PaymentsListFilters } from '@/types';
import { compactFilters } from '@/lib/api/compact-filters';
import { getCustomerReceivable, getPaymentCancelImpact, listPayments } from './service';

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters?: PaymentsListFilters) => [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  receivables: () => [...paymentKeys.all, 'receivable'] as const,
  receivable: (customerId: string) => [...paymentKeys.receivables(), customerId] as const,
  cancelImpacts: () => [...paymentKeys.all, 'cancelImpact'] as const,
  cancelImpact: (id: string) => [...paymentKeys.cancelImpacts(), id] as const
};

export const paymentsQueryOptions = (filters: PaymentsListFilters = {}, token?: string) => {
  const compact = compactFilters(filters as Record<string, unknown>) as PaymentsListFilters;
  return queryOptions({
    queryKey: paymentKeys.list(compact),
    queryFn: () => listPayments(compact, token),
    placeholderData: keepPreviousData
  });
};

export const paymentCancelImpactQueryOptions = (id: string, token?: string) =>
  queryOptions({
    queryKey: paymentKeys.cancelImpact(id),
    queryFn: () => getPaymentCancelImpact(id, token),
    enabled: !!id
  });

export const customerReceivableQueryOptions = (customerId: string, token?: string) =>
  queryOptions({
    queryKey: paymentKeys.receivable(customerId),
    queryFn: () => getCustomerReceivable(customerId, token),
    enabled: !!customerId
  });
