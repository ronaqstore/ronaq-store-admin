import { INPUT_LIMITS } from '@/lib/input-limits';
import type {
  BlockInvalidNumberKeysEvent,
  SanitizeNumberInputOptions
} from '@/types/forms';

export function sanitizeNumberInput(
  raw: string,
  options: SanitizeNumberInputOptions = {}
): string {
  const min = options.min ?? 0;
  const max = options.max ?? INPUT_LIMITS.amountRupeesMax;
  if (raw === '') return '';

  const n = Number(raw);
  if (Number.isNaN(n)) return '';

  let next = n;
  if (next < min) next = min;
  if (next > max) next = max;

  return String(next);
}

export function blockInvalidNumberKeys(
  e: BlockInvalidNumberKeysEvent,
  allowNegative = false
): void {
  if (e.key === 'e' || e.key === 'E' || e.key === '+') {
    e.preventDefault();
    return;
  }
  if (!allowNegative && e.key === '-') {
    e.preventDefault();
  }
}
