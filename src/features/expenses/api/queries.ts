import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { ExpenseQueryFilter, ExpenseCategoryQueryFilter } from '@/types/expense';
import { compactFilters } from '@/lib/api/compact-filters';
import { listExpenseCategories, listExpenses } from './service';

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters?: ExpenseQueryFilter) => [...expenseKeys.lists(), filters] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  categories: (filters?: ExpenseCategoryQueryFilter) =>
    [...expenseKeys.all, 'categories', filters] as const,
  category: (id: string) => [...expenseKeys.all, 'category', id] as const
};

export const expensesQueryOptions = (filters: ExpenseQueryFilter = {}, token?: string) => {
  const compact = compactFilters(filters as Record<string, unknown>) as ExpenseQueryFilter;
  return queryOptions({
    queryKey: expenseKeys.list(compact),
    queryFn: () => listExpenses(compact, token),
    placeholderData: keepPreviousData
  });
};

export const expenseCategoriesQueryOptions = (
  filters: ExpenseCategoryQueryFilter = {},
  token?: string
) => {
  const compact = compactFilters(filters as Record<string, unknown>) as ExpenseCategoryQueryFilter;
  return queryOptions({
    queryKey: expenseKeys.categories(compact),
    queryFn: () => listExpenseCategories(compact, token),
    placeholderData: keepPreviousData
  });
};
