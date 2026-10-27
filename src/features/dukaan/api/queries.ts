import { queryOptions } from '@tanstack/react-query';
import type { ListFilters } from '@/lib/dukaan';
import {
  getShopAttention,
  getShopCashFlow,
  getShopExpensesByCategory,
  getShopInventoryAging,
  getShopKpis,
  getShopProfitWaterfall,
  getShopReceivablesAging,
  getShopSalesMix,
  getShopSalesTrend,
  getShopTopProducts,
} from './service';
import { getCustomerLedgerView } from '@/features/customers/api/service';
import { getSupplierLedgerView } from '@/features/suppliers/api/service';

import type {
  DashboardRangeParams,
  TopProductsParams,
} from '@/types/dashboard';

export const dukaanKeys = {
  all: ['dukaan'] as const,
  session: () => [...dukaanKeys.all, 'session'] as const,
  shopKpis: (p?: DashboardRangeParams) =>
    [...dukaanKeys.all, 'shopKpis', p] as const,
  shopSalesTrend: (p?: DashboardRangeParams) =>
    [...dukaanKeys.all, 'shopSalesTrend', p] as const,
  shopProfitWaterfall: (p?: DashboardRangeParams) =>
    [...dukaanKeys.all, 'shopProfitWaterfall', p] as const,
  shopCashFlow: (p?: DashboardRangeParams) =>
    [...dukaanKeys.all, 'shopCashFlow', p] as const,
  shopReceivablesAging: () =>
    [...dukaanKeys.all, 'shopReceivablesAging'] as const,
  shopTopProducts: (p?: TopProductsParams) =>
    [...dukaanKeys.all, 'shopTopProducts', p] as const,
  shopSalesMix: (p?: DashboardRangeParams) =>
    [...dukaanKeys.all, 'shopSalesMix', p] as const,
  shopExpensesByCategory: (p?: DashboardRangeParams) =>
    [...dukaanKeys.all, 'shopExpensesByCategory', p] as const,
  shopInventoryAging: () =>
    [...dukaanKeys.all, 'shopInventoryAging'] as const,
  shopAttention: () => [...dukaanKeys.all, 'shopAttention'] as const,
  categories: (f?: ListFilters) =>
    [...dukaanKeys.all, 'categories', f] as const,
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
  supplierPayments: (f?: ListFilters) =>
    [...dukaanKeys.all, 'supplierPayments', f] as const,
  expenses: (f?: ListFilters) => [...dukaanKeys.all, 'expenses', f] as const,
  expenseCategories: (f?: ListFilters) =>
    [...dukaanKeys.all, 'expenseCategories', f] as const,
  cash: (f?: ListFilters) => [...dukaanKeys.all, 'cash', f] as const,
  inventoryMovements: (f?: ListFilters) =>
    [...dukaanKeys.all, 'inventoryMovements', f] as const,
  payments: (f?: ListFilters) => [...dukaanKeys.all, 'payments', f] as const,
};

export const shopKpisQueryOptions = (
  params?: DashboardRangeParams,
  token?: string,
) =>
  queryOptions({
    queryKey: dukaanKeys.shopKpis(params),
    queryFn: () => getShopKpis(params, token),
  });

export const shopSalesTrendQueryOptions = (
  params?: DashboardRangeParams,
  token?: string,
) =>
  queryOptions({
    queryKey: dukaanKeys.shopSalesTrend(params),
    queryFn: () => getShopSalesTrend(params, token),
  });

export const shopProfitWaterfallQueryOptions = (
  params?: DashboardRangeParams,
  token?: string,
) =>
  queryOptions({
    queryKey: dukaanKeys.shopProfitWaterfall(params),
    queryFn: () => getShopProfitWaterfall(params, token),
  });

export const shopCashFlowQueryOptions = (
  params?: DashboardRangeParams,
  token?: string,
) =>
  queryOptions({
    queryKey: dukaanKeys.shopCashFlow(params),
    queryFn: () => getShopCashFlow(params, token),
  });

export const shopReceivablesAgingQueryOptions = (token?: string) =>
  queryOptions({
    queryKey: dukaanKeys.shopReceivablesAging(),
    queryFn: () => getShopReceivablesAging(token),
  });

export const shopTopProductsQueryOptions = (
  params?: TopProductsParams,
  token?: string,
) =>
  queryOptions({
    queryKey: dukaanKeys.shopTopProducts(params),
    queryFn: () => getShopTopProducts(params, token),
  });

export const shopSalesMixQueryOptions = (
  params?: DashboardRangeParams,
  token?: string,
) =>
  queryOptions({
    queryKey: dukaanKeys.shopSalesMix(params),
    queryFn: () => getShopSalesMix(params, token),
  });

export const shopExpensesByCategoryQueryOptions = (
  params?: DashboardRangeParams,
  token?: string,
) =>
  queryOptions({
    queryKey: dukaanKeys.shopExpensesByCategory(params),
    queryFn: () => getShopExpensesByCategory(params, token),
  });

export const shopInventoryAgingQueryOptions = (token?: string) =>
  queryOptions({
    queryKey: dukaanKeys.shopInventoryAging(),
    queryFn: () => getShopInventoryAging(token),
  });

export const shopAttentionQueryOptions = (token?: string) =>
  queryOptions({
    queryKey: dukaanKeys.shopAttention(),
    queryFn: () => getShopAttention(token),
  });

export const customerQueryOptions = (id: string, token?: string) =>
  queryOptions({
    queryKey: dukaanKeys.customer(id),
    queryFn: () => getCustomerLedgerView(id, token),
  });

export const supplierQueryOptions = (id: string, token?: string) =>
  queryOptions({
    queryKey: dukaanKeys.supplier(id),
    queryFn: () => getSupplierLedgerView(id, token),
  });
