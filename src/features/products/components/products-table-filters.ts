import { listCategories } from '@/features/categories/api/service';
import { listBrands } from '@/features/brands/api/service';
import { toPaisa } from '@/lib/dukaan/numbers';
import type { AsyncFacetedFilterConfig } from '@/types/data-table';
import type { ProductSellingPriceRangeFilter } from '@/types/products';

export const SELLING_PRICE_RANGE_RUPEES: [number, number] = [0, 1_000_000];

export const categoryAsyncFilter: AsyncFacetedFilterConfig = {
  queryKey: ['categories', 'product-filter'],
  searchPlaceholderKey: 'dukaan.product.searchCategories',
  activeOnly: true,
  fetchPage: async ({ page, pageSize, search }) => {
    const res = await listCategories({
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

export const brandAsyncFilter: AsyncFacetedFilterConfig = {
  queryKey: ['brands', 'product-filter'],
  searchPlaceholderKey: 'dukaan.product.searchBrands',
  activeOnly: true,
  fetchPage: async ({ page, pageSize, search }) => {
    const res = await listBrands({
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

export function firstFilterValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  if (typeof value === 'string' && value.trim()) return value.split(',')[0]?.trim() || undefined;
  return undefined;
}

export function parseRupeePriceRange(value: unknown): ProductSellingPriceRangeFilter {
  if (typeof value !== 'string' || !value.trim()) return {};
  const [minRaw, maxRaw] = value.split(',');
  const minRupees = Number(minRaw);
  const maxRupees = Number(maxRaw);
  return {
    minSellingPrice: Number.isFinite(minRupees) ? toPaisa(minRupees) : undefined,
    maxSellingPrice: Number.isFinite(maxRupees) ? toPaisa(maxRupees) : undefined
  };
}
