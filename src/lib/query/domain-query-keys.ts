import type { QueryKey } from '@tanstack/react-query';
import type { QuerySyncDomain } from '@/types/query-sync';

const DOMAIN_QUERY_KEYS: Record<QuerySyncDomain, readonly QueryKey[]> = {
  sales: [['sales']],
  purchases: [['purchases']],
  payments: [['payments']],
  supplierPayments: [['supplierPayments']],
  expenses: [['expenses']],
  cash: [['cash']],
  inventory: [['inventory']],
  products: [['products']],
  customers: [['customers']],
  suppliers: [['suppliers']],
  brands: [['brands']],
  categories: [['categories']],
  storeSettings: [['store-settings']],
  platform: [['platform']],
  dashboard: [['dukaan', 'dashboard']],
  auth: [['auth']]
};

export function resolveDomainQueryKeys(domains: readonly QuerySyncDomain[]): readonly QueryKey[] {
  const keys: QueryKey[] = [];
  for (const domain of domains) {
    keys.push(...DOMAIN_QUERY_KEYS[domain]);
  }
  return keys;
}
