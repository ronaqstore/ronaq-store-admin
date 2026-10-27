import type { ReactNode } from 'react';
import type { QueryClient } from '@tanstack/react-query';

export type PrefetchFn = (token: string, qc: QueryClient) => Promise<void>;

export interface PrefetchHydrationBoundaryProps {
  prefetch: PrefetchFn;
  children: ReactNode;
  fallback?: ReactNode;
}

export interface ListRouteOpenAddProps {
  defaultOpenAdd?: boolean;
}

export interface AdjustmentsRouteShellProps {
  pageTitle: string;
  pageDescription: string;
  children: ReactNode;
  filters: {
    page: number;
    pageSize: number;
    scope: 'manual' | 'all';
    sortBy: 'createdAt';
    sortOrder: 'desc';
  };
}

export interface SalePrefetchRouteProps {
  id: string;
  children: ReactNode;
}

export interface CustomerLedgerPrefetchRouteProps {
  id: string;
  children: ReactNode;
}

export interface SupplierLedgerPrefetchRouteProps {
  id: string;
  children: ReactNode;
}

export interface RouteSlugParams {
  slug: string[];
}

export interface ShopDashboardRouteContext {
  params: Promise<RouteSlugParams>;
}

export interface DashboardKpisProps {
  params: DashboardRangeParams;
}

export interface DashboardRow2Props {
  params: DashboardRangeParams;
  compare?: boolean;
}

export interface DashboardRow3Props {
  params: DashboardRangeParams;
}

export interface DashboardRow4Props {
  params: DashboardRangeParams;
}

export interface DashboardRow5Props {
  params: DashboardRangeParams;
}

export interface DashboardRangeParams {
  [key: string]: string | number | boolean | undefined;
  period?: string;
  from?: string;
  to?: string;
  compare?: boolean;
}

export interface TopProductsParams extends DashboardRangeParams {
  metric?: string;
  limit?: number;
}

export interface DashboardRange {
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
  granularity: string;
}

export interface FlowKpiTotals {
  sales: number;
  grossProfit: number;
  netProfit: number;
  expenses: number;
}

export interface BalanceKpi {
  cashInHand: number;
  customerUdhar: number;
  supplierPayable: number;
  lowStockCount: number;
}

export interface Sparklines {
  sales: number[];
  grossProfit: number[];
  netProfit: number[];
  expenses: number[];
}

export interface ShopKpisResponse {
  range: DashboardRange;
  totals: FlowKpiTotals;
  previousTotals: FlowKpiTotals;
  sparklines: Sparklines;
  balance: BalanceKpi;
}

export interface SalesTrendBucket {
  date: string;
  sales: number;
  grossProfit: number;
  netProfit: number;
  ordersCount: number;
}

export interface SalesTrendTotals {
  sales: number;
  grossProfit: number;
  netProfit: number;
  ordersCount: number;
}

export interface SalesTrendResponse {
  range: DashboardRange;
  series: SalesTrendBucket[];
  previousSeries?: SalesTrendBucket[];
  totals: SalesTrendTotals;
  previousTotals?: SalesTrendTotals;
}

export interface WaterfallStep {
  name: string;
  amount: number;
  isNegative: boolean;
  runningTotal: number;
}

export interface WaterfallTotals {
  grossSales: number;
  costOfGoods: number;
  returns: number;
  expenses: number;
  netProfit: number;
}

export interface ProfitWaterfallResponse {
  range: DashboardRange;
  steps: WaterfallStep[];
  totals: WaterfallTotals;
}

export interface CashFlowBucket {
  date: string;
  cashIn: number;
  cashOut: number;
  netChange: number;
  closingBalance: number;
}

export interface CashFlowTotals {
  cashIn: number;
  cashOut: number;
  netChange: number;
}

export interface CashFlowResponse {
  range: DashboardRange;
  openingBalance: number;
  closingBalance: number;
  series: CashFlowBucket[];
  totals: CashFlowTotals;
}

export interface AgingBucket {
  bucket: string;
  label: string;
  amount: number;
  customerCount: number;
}

export interface TopDebtor {
  customerId: string;
  name: string;
  phone: string;
  amount: number;
  oldestDays: number;
}

export interface ReceivablesAgingResponse {
  totalUdhar: number;
  buckets: AgingBucket[];
  topDebtors: TopDebtor[];
}

export interface TopProductItem {
  productId: string;
  name: string;
  brand: string;
  trackingType: string;
  value: number;
  marginPct: number;
  unitsSold: number;
}

export interface TopProductsResponse {
  range: DashboardRange;
  metric: string;
  items: TopProductItem[];
}

export interface SalesMixTracking {
  trackingType: string;
  label: string;
  revenue: number;
  profit: number;
  units: number;
  percentage: number;
}

export interface SalesMixCategory {
  categoryId: string;
  name: string;
  revenue: number;
  profit: number;
  percentage: number;
}

export interface SalesMixResponse {
  range: DashboardRange;
  byTrackingType: SalesMixTracking[];
  byCategory: SalesMixCategory[];
  totals: { revenue: number; profit: number };
}

export interface ExpenseCategoryItem {
  categoryId: string;
  name: string;
  amount: number;
  previousAmount: number;
  percentage: number;
}

export interface ExpensesByCategoryResponse {
  range: DashboardRange;
  categories: ExpenseCategoryItem[];
  total: number;
  previousTotal: number;
}

export interface InventoryAgingBucket {
  bucket: string;
  label: string;
  count: number;
  costValue: number;
}

export interface ConditionSplit {
  newCount: number;
  newCostValue: number;
  usedCount: number;
  usedCostValue: number;
}

export interface InventoryAgingResponse {
  totalStockValue: number;
  phoneStockValue: number;
  accessoriesStockValue: number;
  inStockPhonesCount: number;
  agingBuckets: InventoryAgingBucket[];
  conditionSplit: ConditionSplit;
}

export interface AttentionDebtor {
  customerId: string;
  name: string;
  amount: number;
  overdueDays: number;
}

export interface AttentionLowStockProduct {
  productId: string;
  name: string;
  currentStock: number;
  threshold: number;
  trackingType: string;
}

export interface AttentionReconciliation {
  reconciledAt: string;
  difference: number;
  reason: string;
}

export interface AttentionResponse {
  overdueUdhar: {
    count: number;
    totalAmount: number;
    topCustomers: AttentionDebtor[];
  };
  lowStock: AttentionLowStockProduct[];
  cashReconciliationDifference: AttentionReconciliation | null;
  subscriptionDaysLeft: number | null;
}
