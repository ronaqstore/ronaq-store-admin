import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { PURCHASE_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type { CreatePurchaseInput } from '@/lib/api/types';
import type { CancelPurchaseMutationVariables } from '@/types';
import { cancelPurchase, createPurchase } from './service';

export const createPurchaseMutation = mutationOptions({
  mutationFn: (input: CreatePurchaseInput) => createPurchase(input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: PURCHASE_SYNC_DOMAINS });
  }
});

export const cancelPurchaseMutation = mutationOptions({
  mutationFn: ({ id, input }: CancelPurchaseMutationVariables) => cancelPurchase(id, input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: PURCHASE_SYNC_DOMAINS });
  }
});
