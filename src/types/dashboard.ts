import type { ReactNode } from 'react';
import type { QueryClient } from '@tanstack/react-query';

export interface DashboardApiResponse {
  period: string;
  date: string;
  todaySales: number;
  todayNetProfit: number;
  customerUdhar: number;
  supplierPayable: number;
  todayExpenses: number;
  lowStockProducts: number;
  cashPosition: number;
}

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
