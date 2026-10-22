import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { compactFilters } from '@/lib/api/compact-filters';
import type { PlatformShopFilters } from './types';
import * as platform from './service';

export const platformKeys = {
  all: ['platform'] as const,
  overview: () => [...platformKeys.all, 'overview'] as const,
  shops: (filters: PlatformShopFilters) => [...platformKeys.all, 'shops', filters] as const
};

export const platformOverviewQueryOptions = (token?: string) =>
  queryOptions({
    queryKey: platformKeys.overview(),
    queryFn: () => platform.getPlatformOverview(token)
  });

export const platformShopsQueryOptions = (filters: PlatformShopFilters, token?: string) => {
  const compact = compactFilters(filters as Record<string, unknown>) as PlatformShopFilters;
  return queryOptions({
    queryKey: platformKeys.shops(compact),
    queryFn: () => platform.listPlatformShops(compact, token),
    placeholderData: keepPreviousData
  });
};
