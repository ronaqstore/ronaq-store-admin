import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { CASH_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type { CreateCashReconciliationInput, CreateOwnerWithdrawalInput } from '@/types/cash';
import { createCashReconciliation, createOwnerWithdrawal } from './service';

export const createOwnerWithdrawalMutation = mutationOptions({
  mutationFn: (input: CreateOwnerWithdrawalInput) => createOwnerWithdrawal(input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: CASH_SYNC_DOMAINS });
  }
});

export const createCashReconciliationMutation = mutationOptions({
  mutationFn: (input: CreateCashReconciliationInput) => createCashReconciliation(input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: CASH_SYNC_DOMAINS });
  }
});
