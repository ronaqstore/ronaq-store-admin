import { apiRequest } from '@/lib/api/client';
import { buildQueryString } from '@/lib/api/query-params';
import type { ListFilters, Paginated } from '@/lib/dukaan';
import type { PaginatedResponse } from '@/lib/api/types';
import type { MarketplaceCityOption, MarketplaceHubOption } from '@/types/marketplace';

const HUBS_PAGE_SIZE = 20;

export async function fetchMarketplaceHubsPage(
  filters: ListFilters = {}
): Promise<Paginated<MarketplaceCityOption>> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? filters.pageSize ?? HUBS_PAGE_SIZE;
  const qs = buildQueryString({
    page,
    limit,
    ...(filters.search?.trim() ? { q: filters.search.trim() } : {})
  });
  const raw = await apiRequest<PaginatedResponse<MarketplaceHubOption>>(
    `/public/marketplace/hubs${qs}`
  );
  const items = Array.isArray(raw?.items) ? raw.items : [];
  return {
    items: items.map((hub) => ({ id: hub.name, name: hub.name })),
    total: raw?.total ?? 0,
    page: raw?.page ?? page,
    limit: raw?.pageSize ?? limit
  };
}

export async function resolveMarketplaceCitySuggestion(
  suggested: string
): Promise<string | null> {
  const token = suggested.trim().toLowerCase();
  if (!token) return null;
  const page = await fetchMarketplaceHubsPage({
    page: 1,
    limit: HUBS_PAGE_SIZE,
    search: suggested.trim()
  });
  const exact = page.items.find((hub) => hub.name.toLowerCase() === token);
  if (exact) return exact.name;
  const partial = page.items.find(
    (hub) =>
      hub.name.toLowerCase().includes(token) || token.includes(hub.name.toLowerCase())
  );
  return partial?.name ?? null;
}
