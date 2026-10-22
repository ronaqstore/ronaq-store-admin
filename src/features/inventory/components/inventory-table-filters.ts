import { toPaisa } from '@/lib/dukaan/numbers';
import type { InventoryStockValueRangeFilter } from '@/types/inventory';

export const INVENTORY_COST_RANGE_RUPEES: [number, number] = [0, 10_000_000];

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

export function parseExactQuantity(value: unknown): number | undefined {
  const raw = Array.isArray(value)
    ? value[0]
    : typeof value === 'string'
      ? value.trim()
      : value;
  if (raw === undefined || raw === null || raw === '') return undefined;
  const qty = Number(raw);
  if (!Number.isFinite(qty) || qty < 0 || !Number.isInteger(qty)) return undefined;
  return qty;
}
