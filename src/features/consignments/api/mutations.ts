import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { CONSIGNMENT_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type { CreateConsignmentInput } from '@/lib/api/types';
import type {
  CancelConsignmentMutationVariables,
  ReturnConsignmentMutationVariables,
  SettleConsignmentMutationVariables
} from '@/types/consignments';
import {
  cancelConsignment,
  createConsignment,
  returnConsignment,
  settleConsignment
} from './service';

export const createConsignmentMutation = mutationOptions({
  mutationFn: (input: CreateConsignmentInput) => createConsignment(input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: CONSIGNMENT_SYNC_DOMAINS });
  }
});

export const returnConsignmentMutation = mutationOptions({
  mutationFn: ({ id, input }: ReturnConsignmentMutationVariables) => returnConsignment(id, input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: CONSIGNMENT_SYNC_DOMAINS });
  }
});

export const settleConsignmentMutation = mutationOptions({
  mutationFn: ({ id, input }: SettleConsignmentMutationVariables) => settleConsignment(id, input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: CONSIGNMENT_SYNC_DOMAINS });
  }
});

export const cancelConsignmentMutation = mutationOptions({
  mutationFn: ({ id, input }: CancelConsignmentMutationVariables) => cancelConsignment(id, input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: CONSIGNMENT_SYNC_DOMAINS });
  }
});
