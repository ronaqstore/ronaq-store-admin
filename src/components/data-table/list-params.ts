'use client';

import { parseAsInteger, parseAsString, useQueryState, useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import { getSortingStateParser } from '@/lib/parsers';
import type { ListFilters } from '@/lib/dukaan';

export const DUKAAN_DEFAULT_PAGE_SIZE = 20;

export function pickFilterValue(values: unknown): string | undefined {
  if (values == null || values === '') return undefined;
  if (typeof values === 'string') {
    const trimmed = values.trim();
    return trimmed || undefined;
  }
  if (Array.isArray(values)) {
    const joined = values
      .map((item) => (item == null ? '' : String(item).trim()))
      .filter(Boolean)
      .join(',');
    return joined || undefined;
  }
  if (typeof values === 'number' || typeof values === 'boolean') {
    return String(values);
  }
  return undefined;
}

export function parseBinaryFacet<T extends string>(
  param: unknown,
  optA: T,
  optB: T
): T | undefined {
  if (!param) return undefined;
  const items = Array.isArray(param)
    ? (param as string[])
    : typeof param === 'string'
      ? param.split(',')
      : [];
  if (items.includes(optA) && !items.includes(optB)) return optA;
  if (items.includes(optB) && !items.includes(optA)) return optB;
  return undefined;
}

export function parseActiveCancelledStatus(
  statusParam: unknown
): 'ACTIVE' | 'CANCELLED' | undefined {
  return parseBinaryFacet(statusParam, 'ACTIVE', 'CANCELLED');
}

export function parseBooleanFacet(param: unknown): boolean | undefined {
  if (!param) return undefined;
  const items = Array.isArray(param)
    ? (param as string[])
    : typeof param === 'string'
      ? param.split(',')
      : [];
  const hasTrue = items.includes('true');
  const hasFalse = items.includes('false');
  if (hasTrue && !hasFalse) return true;
  if (hasFalse && !hasTrue) return false;
  return undefined;
}

export function useDukaanListParams<TSort extends string | undefined = string>(
  sortableColumnIds: string[],
  searchKey = 'name',
  filterKeys: string[] = [],
  defaultSort?: TSort,
  defaultOrder: 'asc' | 'desc' = 'desc'
) {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(DUKAAN_DEFAULT_PAGE_SIZE),
    sort: getSortingStateParser(sortableColumnIds).withDefault([])
  });

  const [search] = useQueryState(searchKey, parseAsString);

  const filterKeysKey = filterKeys.join(',');
  const filterParsers = useMemo(
    () =>
      Object.fromEntries(
        filterKeysKey ? filterKeysKey.split(',').map((key) => [key, parseAsString]) : []
      ) as Record<string, typeof parseAsString>,
    [filterKeysKey]
  );

  const [facetValues] = useQueryStates(filterParsers);

  const filters: ListFilters = {
    page: params.page,
    limit: params.perPage,
    ...(search && { search }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  for (const key of filterKeys) {
    const value = pickFilterValue(facetValues[key]);
    if (value) {
      (filters as Record<string, string | number | undefined>)[key] = value;
    }
  }

  const sortItem = params.sort[0];
  let sortBy: TSort | undefined = defaultSort;
  let sortOrder: 'asc' | 'desc' = defaultOrder;

  if (sortItem && sortableColumnIds.includes(sortItem.id)) {
    sortBy = sortItem.id as TSort;
    sortOrder = sortItem.desc ? 'desc' : 'asc';
  }

  const getPageCount = (total: number) => Math.max(1, Math.ceil(total / params.perPage));

  return { params, filters, search, sortBy, sortOrder, getPageCount };
}
