export function compactFilters<T extends Record<string, unknown>>(filters: T): Partial<T> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    next[key] = value;
  }
  return next as Partial<T>;
}
