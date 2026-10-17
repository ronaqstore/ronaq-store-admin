import { apiRequest } from '@/lib/api/client';
import { appFetch } from '@/lib/api/app-fetch';
import { buildQueryString } from '@/lib/api/query-params';
import type { PaginatedResponse } from '@/lib/api/types';
import type {
  CreatePlatformShopInput,
  CreatePlatformShopResult,
  PlatformOverview,
  PlatformShop,
  PlatformShopFilters,
  UpdateSubscriptionInput,
  UpdateSubscriptionResult
} from './types';

function shopsQuery(filters: PlatformShopFilters = {}): string {
  return buildQueryString({
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? filters.limit ?? 10,
    search: filters.search,
    accessStatus: filters.accessStatus,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder
  } as Record<string, unknown>);
}

export async function getPlatformOverview(token?: string): Promise<PlatformOverview> {
  if (token) {
    return apiRequest<PlatformOverview>('/platform-admin/shops/overview', undefined, token);
  }
  return appFetch<PlatformOverview>('/api/platform-admin/shops/overview');
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
