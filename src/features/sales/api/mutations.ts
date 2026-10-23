import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { SALE_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type { CreateSaleInput } from '@/lib/api/types';
import { cancelSale, createReturn, createSale, previewReturn } from './service';

import type {
  CancelSaleMutationVariables,
  PreviewReturnMutationVariables,
  CreateReturnMutationVariables
} from '@/types';

export const createSaleMutation = mutationOptions({
  mutationFn: (input: CreateSaleInput) => createSale(input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: SALE_SYNC_DOMAINS });
  }
});

export const cancelSaleMutation = mutationOptions({
  mutationFn: ({ id, input }: CancelSaleMutationVariables) => cancelSale(id, input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: SALE_SYNC_DOMAINS });
  }
});

export const previewReturnMutation = mutationOptions({
  mutationFn: ({ id, input }: PreviewReturnMutationVariables) => previewReturn(id, input)
});

export const createReturnMutation = mutationOptions({
  mutationFn: ({ id, input }: CreateReturnMutationVariables) => createReturn(id, input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: SALE_SYNC_DOMAINS });
  }
});
