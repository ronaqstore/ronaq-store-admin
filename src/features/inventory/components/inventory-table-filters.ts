import { createProductAsyncFilter } from '@/components/common/product-async-filter';
import { toPaisa } from '@/lib/dukaan/numbers';
import type { InventoryStockValueRangeFilter } from '@/types/inventory';
export { firstFilterValue as firstInventoryFilterValue } from '@/lib/dukaan/money-range-filter';

export const INVENTORY_COST_RANGE_RUPEES: [number, number] = [0, 10_000_000];

export const inventoryProductAsyncFilter = createProductAsyncFilter('inventory-filter');

export function parseInventoryCostRange(value: unknown): InventoryStockValueRangeFilter {
  if (typeof value !== 'string' || !value.trim()) return {};
  const [minRaw, maxRaw] = value.split(',');
  const minRupees = Number(minRaw);
  const maxRupees = Number(maxRaw);
  return {
    minStockValue: Number.isFinite(minRupees) ? toPaisa(minRupees) : undefined,
    maxStockValue: Number.isFinite(maxRupees) ? toPaisa(maxRupees) : undefined
  };
}

export { parseExactNonNegativeInt as parseExactQuantity } from '@/lib/dukaan/money-range-filter';
