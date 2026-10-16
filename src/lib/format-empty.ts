export const EMPTY_DISPLAY = '—';

export function formatEmpty(
  value: string | number | null | undefined,
  fallback: string = EMPTY_DISPLAY
): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;
  return String(value);
}
