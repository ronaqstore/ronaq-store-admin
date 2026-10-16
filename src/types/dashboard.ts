import type { ReactNode } from 'react';
import type { QueryClient } from '@tanstack/react-query';

export type PrefetchFn = (token: string, qc: QueryClient) => Promise<void>;

export interface PrefetchHydrationBoundaryProps {
  prefetch: PrefetchFn;
  children: ReactNode;
}

export interface ListRouteOpenAddProps {
  defaultOpenAdd?: boolean;
}

export interface AdjustmentsRouteShellProps {
  pageTitle: string;
  pageDescription: string;
  children: ReactNode;
}

export interface SalePrefetchRouteProps {
  id: string;
  children: ReactNode;
}
