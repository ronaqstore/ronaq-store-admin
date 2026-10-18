import { queryOptions } from '@tanstack/react-query';
import type { PlatformShopFilters } from './types';
import * as platform from './service';

export const PLATFORM_SHOPS_REFETCH_MS = 20_000;

export const platformKeys = {
  all: ['platform'] as const,
  overview: () => [...platformKeys.all, 'overview'] as const,
  shops: (filters: PlatformShopFilters) => [...platformKeys.all, 'shops', filters] as const
};

export const platformOverviewQueryOptions = (token?: string) =>
  queryOptions({
    queryKey: platformKeys.overview(),
    queryFn: () => platform.getPlatformOverview(token),
    staleTime: 0,
    refetchInterval: PLATFORM_SHOPS_REFETCH_MS,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false
  });

export const platformShopsQueryOptions = (filters: PlatformShopFilters, token?: string) =>
  queryOptions({
    queryKey: platformKeys.shops(filters),
    queryFn: () => platform.listPlatformShops(filters, token),
    staleTime: 0,
    refetchInterval: PLATFORM_SHOPS_REFETCH_MS,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false
  });
