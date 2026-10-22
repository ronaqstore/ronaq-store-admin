import { listProducts } from '@/features/products/api/service';
import type { AsyncFacetedFilterConfig } from '@/types/data-table';

export const productAsyncFilter: AsyncFacetedFilterConfig = {
  queryKey: ['products', 'adjustment-filter'],
  searchPlaceholderKey: 'search.products',
  activeOnly: true,
  fetchPage: async ({ page, pageSize, search }) => {
    const res = await listProducts({
      page,
      pageSize,
      search,
      isActive: true,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    return {
      items: res.items,
      total: res.total,
      page: res.page,
      pageSize: res.pageSize
    };
  }
};

export function firstAdjustmentFilterValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  if (typeof value === 'string' && value.trim()) return value.split(',')[0]?.trim() || undefined;
  return undefined;
}

export function parseExactQuantityChange(value: unknown): number | undefined {
  const raw = Array.isArray(value)
    ? value[0]
    : typeof value === 'string'
      ? value.trim()
      : value;
  if (raw === undefined || raw === null || raw === '') return undefined;
  const qty = Number(raw);
  if (!Number.isFinite(qty) || !Number.isInteger(qty)) return undefined;
  return qty;
}
