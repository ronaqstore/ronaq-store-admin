import { listSuppliers } from '@/features/suppliers/api/service';
import { toPaisa } from '@/lib/dukaan/numbers';
import type { AsyncFacetedFilterConfig } from '@/types/data-table';
import type { PurchaseMoneyRangeFilter } from '@/types/purchases';

export const PURCHASE_MONEY_RANGE_RUPEES: [number, number] = [0, 10_000_000];

export const supplierAsyncFilter: AsyncFacetedFilterConfig = {
  queryKey: ['suppliers', 'purchase-filter'],
  searchPlaceholderKey: 'search.suppliers',
  activeOnly: true,
  fetchPage: async ({ page, pageSize, search }) => {
    const res = await listSuppliers({
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

export function firstPurchaseFilterValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  if (typeof value === 'string' && value.trim()) return value.split(',')[0]?.trim() || undefined;
  return undefined;
}

export function parseRupeeMoneyRange(value: unknown): PurchaseMoneyRangeFilter {
  if (typeof value !== 'string' || !value.trim()) return {};
  const [minRaw, maxRaw] = value.split(',');
  const minRupees = Number(minRaw);
  const maxRupees = Number(maxRaw);
  return {
    minAmount: Number.isFinite(minRupees) ? toPaisa(minRupees) : undefined,
    maxAmount: Number.isFinite(maxRupees) ? toPaisa(maxRupees) : undefined
  };
}

export function parsePurchasePayStatus(
  value: unknown
): 'PAID' | 'PARTIAL' | 'PAYABLE' | 'CANCELLED' | undefined {
  const raw = firstPurchaseFilterValue(value);
  if (raw === 'PAID' || raw === 'PARTIAL' || raw === 'PAYABLE' || raw === 'CANCELLED') {
    return raw;
  }
  return undefined;
}
