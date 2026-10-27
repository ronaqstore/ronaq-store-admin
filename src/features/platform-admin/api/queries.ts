import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { compactFilters } from '@/lib/api/compact-filters';
import type { PlatformShopFilters } from './types';
import * as platform from './service';

export const platformKeys = {
  all: ['platform'] as const,
  dashboardKpis: () => [...platformKeys.all, 'dashboardKpis'] as const,
  shopGrowth: (months: number) => [...platformKeys.all, 'shopGrowth', months] as const,
  renewals: (weeks: number) => [...platformKeys.all, 'renewals', weeks] as const,
  funnel: () => [...platformKeys.all, 'funnel'] as const,
  cities: (limit: number) => [...platformKeys.all, 'cities', limit] as const,
  activity: (days: number) => [...platformKeys.all, 'activity', days] as const,
  atRisk: (page: number, pageSize: number) =>
    [...platformKeys.all, 'atRisk', page, pageSize] as const,
   shops: (filters: PlatformShopFilters) => [...platformKeys.all, 'shops', filters] as const
};

export const platformDashboardKpisQueryOptions = (token?: string) =>
  queryOptions({
    queryKey: platformKeys.dashboardKpis(),
    queryFn: () => platform.getPlatformDashboardKpis(token)
  });

export const platformShopGrowthQueryOptions = (months = 12, token?: string) =>
  queryOptions({
    queryKey: platformKeys.shopGrowth(months),
    queryFn: () => platform.getPlatformShopGrowth(months, token)
  });

export const platformRenewalsQueryOptions = (weeks = 8, token?: string) =>
  queryOptions({
    queryKey: platformKeys.renewals(weeks),
    queryFn: () => platform.getPlatformRenewals(weeks, token)
  });

export const platformFunnelQueryOptions = (token?: string) =>
  queryOptions({
    queryKey: platformKeys.funnel(),
    queryFn: () => platform.getPlatformOnboardingFunnel(token)
  });

export const platformCitiesQueryOptions = (limit = 10, token?: string) =>
  queryOptions({
    queryKey: platformKeys.cities(limit),
    queryFn: () => platform.getPlatformShopsByCity(limit, token)
  });

export const platformActivityQueryOptions = (days: 30 | 90 = 30, token?: string) =>
  queryOptions({
    queryKey: platformKeys.activity(days),
    queryFn: () => platform.getPlatformActivity(days, token)
  });

export const platformAtRiskQueryOptions = (page = 1, pageSize = 20, token?: string) =>
  queryOptions({
    queryKey: platformKeys.atRisk(page, pageSize),
    queryFn: () => platform.getPlatformAtRisk(page, pageSize, token),
    placeholderData: keepPreviousData
  });

export const platformShopsQueryOptions = (filters: PlatformShopFilters, token?: string) => {
  const compact = compactFilters(filters as Record<string, unknown>) as PlatformShopFilters;
  return queryOptions({
    queryKey: platformKeys.shops(compact),
    queryFn: () => platform.listPlatformShops(compact, token),
    placeholderData: keepPreviousData
  });
};
