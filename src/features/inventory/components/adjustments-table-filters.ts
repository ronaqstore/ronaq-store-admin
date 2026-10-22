import { createProductAsyncFilter } from '@/components/common/product-async-filter';
export { firstFilterValue as firstAdjustmentFilterValue } from '@/lib/dukaan/money-range-filter';

export const productAsyncFilter = createProductAsyncFilter('adjustment-filter');

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
