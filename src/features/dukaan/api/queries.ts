import { queryOptions } from '@tanstack/react-query';
import type { ListFilters } from '@/lib/dukaan';
import { getDashboardKpis } from './service';
import { getCustomerLedgerView } from '@/features/customers/api/service';
import { getSupplierLedgerView } from '@/features/suppliers/api/service';

export const dukaanKeys = {
  all: ['dukaan'] as const,
  session: () => [...dukaanKeys.all, 'session'] as const,
  dashboard: () => [...dukaanKeys.all, 'dashboard'] as const,
  categories: (f?: ListFilters) => [...dukaanKeys.all, 'categories', f] as const,
  brands: (f?: ListFilters) => [...dukaanKeys.all, 'brands', f] as const,
  products: (f?: ListFilters) => [...dukaanKeys.all, 'products', f] as const,
  product: (id: string) => [...dukaanKeys.all, 'product', id] as const,
  suppliers: (f?: ListFilters) => [...dukaanKeys.all, 'suppliers', f] as const,
  supplier: (id: string) => [...dukaanKeys.all, 'supplier', id] as const,
  customers: (f?: ListFilters) => [...dukaanKeys.all, 'customers', f] as const,
  customer: (id: string) => [...dukaanKeys.all, 'customer', id] as const,
  purchases: (f?: ListFilters) => [...dukaanKeys.all, 'purchases', f] as const,
  purchase: (id: string) => [...dukaanKeys.all, 'purchase', id] as const,
  stock: (f?: ListFilters) => [...dukaanKeys.all, 'stock', f] as const,
  sales: (f?: ListFilters) => [...dukaanKeys.all, 'sales', f] as const,
  sale: (id: string) => [...dukaanKeys.all, 'sale', id] as const,
  supplierPayments: (f?: ListFilters) => [...dukaanKeys.all, 'supplierPayments', f] as const,
  expenses: (f?: ListFilters) => [...dukaanKeys.all, 'expenses', f] as const,
  expenseCategories: (f?: ListFilters) => [...dukaanKeys.all, 'expenseCategories', f] as const,
  cash: (f?: ListFilters) => [...dukaanKeys.all, 'cash', f] as const,
  inventoryMovements: (f?: ListFilters) => [...dukaanKeys.all, 'inventoryMovements', f] as const,
  payments: (f?: ListFilters) => [...dukaanKeys.all, 'payments', f] as const
};

export const dashboardQueryOptions = (token?: string) =>
  queryOptions({
    queryKey: dukaanKeys.dashboard(),
    queryFn: () => getDashboardKpis('today', token)
  });

export const customerQueryOptions = (id: string, token?: string) =>
  queryOptions({
    queryKey: dukaanKeys.customer(id),
    queryFn: () => getCustomerLedgerView(id, token)
  });

export const supplierQueryOptions = (id: string, token?: string) =>
  queryOptions({
    queryKey: dukaanKeys.supplier(id),
    queryFn: () => getSupplierLedgerView(id, token)
  });
