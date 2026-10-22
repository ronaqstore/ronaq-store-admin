import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { CASH_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type { CreateOwnerWithdrawalInput } from '@/types/cash';
import { createOwnerWithdrawal } from './service';

export const createOwnerWithdrawalMutation = mutationOptions({
  mutationFn: (input: CreateOwnerWithdrawalInput) => createOwnerWithdrawal(input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: CASH_SYNC_DOMAINS });
  }
});
