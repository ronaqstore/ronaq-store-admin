import type { QueryClient } from '@tanstack/react-query';

export type QuerySyncDomain =
  | 'sales'
  | 'purchases'
  | 'payments'
  | 'supplierPayments'
  | 'expenses'
  | 'cash'
  | 'inventory'
  | 'products'
  | 'customers'
  | 'suppliers'
  | 'brands'
  | 'categories'
  | 'storeSettings'
  | 'platform'
  | 'dashboard'
  | 'auth';

export interface InvalidateDomainsOptions {
  queryClient: QueryClient;
  domains: readonly QuerySyncDomain[];
  broadcast?: boolean;
}

export interface QuerySyncBroadcastMessage {
  type: 'invalidate-domains';
  domains: QuerySyncDomain[];
}
