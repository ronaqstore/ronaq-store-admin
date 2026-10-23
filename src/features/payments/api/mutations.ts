import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { PAYMENT_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type { CreatePaymentInput } from '@/lib/api/types';
import type { CancelPaymentMutationVariables } from '@/types';
import { cancelPayment, createPayment } from './service';

export const createPaymentMutation = mutationOptions({
  mutationFn: (input: CreatePaymentInput) => createPayment(input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: PAYMENT_SYNC_DOMAINS });
  }
});

export const cancelPaymentMutation = mutationOptions({
  mutationFn: ({ id, input }: CancelPaymentMutationVariables) => cancelPayment(id, input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: PAYMENT_SYNC_DOMAINS });
  }
});
