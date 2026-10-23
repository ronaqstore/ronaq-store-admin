import { toPaisa } from '@/lib/dukaan/numbers';
import type { FacetDateRangeFilter, MoneyRangeFilter } from '@/types/money-filters';

export const MONEY_RANGE_RUPEES: [number, number] = [0, 10_000_000];

export function firstFilterValue(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  if (Array.isArray(value)) {
    const first = value[0];
    if (first == null || first === '') return undefined;
    return String(first).trim() || undefined;
  }
  if (typeof value === 'string') return value.split(',')[0]?.trim() || undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

export function parseRupeeMoneyRange(value: unknown): MoneyRangeFilter {
  const raw =
    typeof value === 'string'
      ? value.trim()
      : Array.isArray(value)
        ? value.map(String).join(',')
        : '';
  if (!raw) return {};
  const [minRaw, maxRaw] = raw.split(',');
  const minRupees = Number(minRaw);
  const maxRupees = Number(maxRaw);
  return {
    minAmount: Number.isFinite(minRupees) ? toPaisa(minRupees) : undefined,
    maxAmount: Number.isFinite(maxRupees) ? toPaisa(maxRupees) : undefined
  };
}

export function timestampToYmd(value?: string | null): string | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseFacetDateRange(value: unknown): FacetDateRangeFilter {
  const dateParts = Array.isArray(value)
    ? (value as string[])
    : typeof value === 'string'
      ? value.split(',')
      : [];
  return {
    from: timestampToYmd(dateParts[0]),
    to: timestampToYmd(dateParts[1])
  };
}

export function parseExactNonNegativeInt(value: unknown): number | undefined {
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
