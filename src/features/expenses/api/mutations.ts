import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import {
  EXPENSE_CATEGORY_SYNC_DOMAINS,
  EXPENSE_SYNC_DOMAINS
} from '@/lib/query/sync-domains';
import type {
  CreateExpenseInput,
  CreateExpenseCategoryInput,
  CancelExpenseMutationVariables,
  UpdateExpenseCategoryMutationVariables
} from '@/types/expense';
import {
  cancelExpense,
  createExpense,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory
} from './service';

export const createExpenseMutation = mutationOptions({
  mutationFn: (input: CreateExpenseInput) => createExpense(input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: EXPENSE_SYNC_DOMAINS });
  }
});

export const cancelExpenseMutation = mutationOptions({
  mutationFn: ({ id, input }: CancelExpenseMutationVariables) => cancelExpense(id, input),
  onSuccess: () => {
    invalidateDomains({ queryClient: getQueryClient(), domains: EXPENSE_SYNC_DOMAINS });
  }
});

export const createExpenseCategoryMutation = mutationOptions({
  mutationFn: (input: CreateExpenseCategoryInput) => createExpenseCategory(input),
  onSuccess: () => {
    invalidateDomains({
      queryClient: getQueryClient(),
      domains: EXPENSE_CATEGORY_SYNC_DOMAINS
    });
  }
});

export const updateExpenseCategoryMutation = mutationOptions({
  mutationFn: ({ id, input }: UpdateExpenseCategoryMutationVariables) =>
    updateExpenseCategory(id, input),
  onSuccess: () => {
    invalidateDomains({
      queryClient: getQueryClient(),
      domains: EXPENSE_CATEGORY_SYNC_DOMAINS
    });
  }
});

export const deleteExpenseCategoryMutation = mutationOptions({
  mutationFn: (id: string) => deleteExpenseCategory(id),
  onSuccess: () => {
    invalidateDomains({
      queryClient: getQueryClient(),
      domains: EXPENSE_CATEGORY_SYNC_DOMAINS
    });
  }
});
