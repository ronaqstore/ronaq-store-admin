import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { SUPPLIER_PAYMENT_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type {
  CreateSupplierPaymentInput,
  CancelSupplierPaymentMutationVariables
} from '@/types/supplier-payment';
import { cancelSupplierPayment, createSupplierPayment } from './service';

export const createSupplierPaymentMutation = mutationOptions({
  mutationFn: (input: CreateSupplierPaymentInput) => createSupplierPayment(input),
  onSuccess: () => {
    invalidateDomains({
      queryClient: getQueryClient(),
      domains: SUPPLIER_PAYMENT_SYNC_DOMAINS
    });
  }
});

export const cancelSupplierPaymentMutation = mutationOptions({
  mutationFn: ({ id, input }: CancelSupplierPaymentMutationVariables) =>
    cancelSupplierPayment(id, input),
  onSuccess: () => {
    invalidateDomains({
      queryClient: getQueryClient(),
      domains: SUPPLIER_PAYMENT_SYNC_DOMAINS
    });
  }
});
