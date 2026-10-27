import { apiRequest } from '@/lib/api/client';
import { appFetch } from '@/lib/api/app-fetch';
import { buildQueryString } from '@/lib/api/query-params';
import type { PaginatedResponse } from '@/lib/api/types';
import type {
  ActivityResponse,
  AtRiskResponse,
  CreatePlatformShopInput,
  CreatePlatformShopResult,
  OnboardingFunnelResponse,
  PlatformDashboardKpis,
  PlatformShop,
  PlatformShopFilters,
  RenewalsResponse,
  ShopGrowthResponse,
  ShopsByCityResponse,
  UpdateSubscriptionInput,
  UpdateSubscriptionResult
} from './types';

function buildParams(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') sp.set(key, String(val));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

async function fetchPlatformDashboard<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
  token?: string
): Promise<T> {
  const qs = buildParams(params);
  const path = `/platform/dashboard/${endpoint}${qs}`;
  if (token) return apiRequest<T>(path, undefined, token);
  return appFetch<T>(`/api${path}`);
}

function shopsQuery(filters: PlatformShopFilters = {}): string {
  return buildQueryString({
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? filters.limit ?? 10,
    search: filters.search,
    accessStatus: filters.accessStatus,
    subscriptionFrom: filters.subscriptionFrom,
    subscriptionTo: filters.subscriptionTo,
    createdFrom: filters.createdFrom,
    createdTo: filters.createdTo,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder
  } as Record<string, unknown>);
}

export async function getPlatformDashboardKpis(
  token?: string
): Promise<PlatformDashboardKpis> {
  return fetchPlatformDashboard<PlatformDashboardKpis>('kpis', undefined, token);
}

export async function getPlatformShopGrowth(
  months = 12,
  token?: string
): Promise<ShopGrowthResponse> {
  return fetchPlatformDashboard<ShopGrowthResponse>('shop-growth', { months }, token);
}

export async function getPlatformRenewals(
  weeks = 8,
  token?: string
): Promise<RenewalsResponse> {
  return fetchPlatformDashboard<RenewalsResponse>('renewals', { weeks }, token);
}

export async function getPlatformOnboardingFunnel(
  token?: string
): Promise<OnboardingFunnelResponse> {
  return fetchPlatformDashboard<OnboardingFunnelResponse>(
    'onboarding-funnel',
    undefined,
    token
  );
}

export async function getPlatformShopsByCity(
  limit = 10,
  token?: string
): Promise<ShopsByCityResponse> {
  return fetchPlatformDashboard<ShopsByCityResponse>('shops-by-city', { limit }, token);
}

export async function getPlatformActivity(
  days: 30 | 90 = 30,
  token?: string
): Promise<ActivityResponse> {
  return fetchPlatformDashboard<ActivityResponse>('activity', { days }, token);
}

export async function getPlatformAtRisk(
  page = 1,
  pageSize = 20,
  token?: string
): Promise<AtRiskResponse> {
  return fetchPlatformDashboard<AtRiskResponse>('at-risk', { page, pageSize }, token);
}

export async function listPlatformShops(
  filters: PlatformShopFilters = {},
  token?: string
): Promise<PaginatedResponse<PlatformShop>> {
  const qs = shopsQuery(filters);
  if (token) {
    return apiRequest<PaginatedResponse<PlatformShop>>(
      `/platform-admin/shops${qs}`,
      undefined,
      token
    );
  }
  return appFetch<PaginatedResponse<PlatformShop>>(`/api/platform-admin/shops${qs}`);
}

export async function createPlatformShop(
  input: CreatePlatformShopInput
): Promise<CreatePlatformShopResult> {
  return appFetch<CreatePlatformShopResult>('/api/platform-admin/shops', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function updateShopSubscription(
  shopId: string,
  input: UpdateSubscriptionInput
): Promise<UpdateSubscriptionResult> {
  return appFetch<UpdateSubscriptionResult>(`/api/platform-admin/shops/${shopId}/subscription`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}
