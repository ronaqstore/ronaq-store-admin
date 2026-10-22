'use client';

import {
  type ColumnFiltersState,
  type ColumnPinningState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import {
  type Parser,
  type UseQueryStateOptions,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates
} from 'nuqs';
import * as React from 'react';

import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { getSortingStateParser } from '@/lib/parsers';
import type { ExtendedColumnSort, UseDataTableProps } from '@/types/data-table';

const PAGE_KEY = 'page';
const PER_PAGE_KEY = 'perPage';
const SORT_KEY = 'sort';
const ARRAY_SEPARATOR = ',';
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns,
    pageCount = -1,
    initialState,
    history = 'replace',
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    clearOnDefault = false,
    enableAdvancedFilter = false,
    scroll = false,
    shallow = true,
    startTransition,
    isLoading,
    ...tableProps
  } = props;

  const queryStateOptions = React.useMemo<Omit<UseQueryStateOptions<string>, 'parse'>>(
    () => ({
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition
    }),
    [history, scroll, shallow, throttleMs, debounceMs, clearOnDefault, startTransition]
  );

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {}
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialState?.columnVisibility ?? {}
  );
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(
    initialState?.columnPinning ?? {}
  );

  const [page, setPage] = useQueryState(
    PAGE_KEY,
    parseAsInteger.withOptions(queryStateOptions).withDefault(1)
  );
  const [perPage, setPerPage] = useQueryState(
    PER_PAGE_KEY,
    parseAsInteger
      .withOptions(queryStateOptions)
      .withDefault(initialState?.pagination?.pageSize ?? 20)
  );

  const pagination: PaginationState = React.useMemo(() => {
    return {
      pageIndex: page - 1,
      pageSize: perPage
    };
  }, [page, perPage]);

  const onPaginationChange = React.useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      if (typeof updaterOrValue === 'function') {
        const newPagination = updaterOrValue(pagination);
        void setPage(newPagination.pageIndex + 1);
        void setPerPage(newPagination.pageSize);
      } else {
        void setPage(updaterOrValue.pageIndex + 1);
        void setPerPage(updaterOrValue.pageSize);
      }
    },
    [pagination, setPage, setPerPage]
  );

  const columnIds = React.useMemo(() => {
    return new Set(columns.map((column) => column.id).filter(Boolean) as string[]);
  }, [columns]);

  const [sorting, setSorting] = useQueryState(
    SORT_KEY,
    getSortingStateParser<TData>(columnIds)
      .withOptions(queryStateOptions)
      .withDefault(initialState?.sorting ?? [])
  );

  const onSortingChange = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      if (typeof updaterOrValue === 'function') {
        const newSorting = updaterOrValue(sorting);
        setSorting(newSorting as ExtendedColumnSort<TData>[]);
      } else {
        setSorting(updaterOrValue as ExtendedColumnSort<TData>[]);
      }
    },
    [sorting, setSorting]
  );

  const filterableColumns = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return columns.filter((column) => column.enableColumnFilter);
  }, [columns, enableAdvancedFilter]);

  const filterParsers = React.useMemo(() => {
    if (enableAdvancedFilter) return {};

    return filterableColumns.reduce<Record<string, Parser<string> | Parser<string[]>>>(
      (acc, column) => {
        const variant = column.meta?.variant;
        const usesArray =
          !!column.meta?.options ||
          !!column.meta?.asyncOptions ||
          variant === 'date' ||
          variant === 'dateRange' ||
          variant === 'range';

        if (usesArray) {
          acc[column.id ?? ''] = parseAsArrayOf(parseAsString, ARRAY_SEPARATOR).withOptions(
            queryStateOptions
          );
        } else {
          acc[column.id ?? ''] = parseAsString.withOptions(queryStateOptions);
        }
        return acc;
      },
      {}
    );
  }, [filterableColumns, queryStateOptions, enableAdvancedFilter]);

  const [filterValues, setFilterValues] = useQueryStates(filterParsers);

  const debouncedSetFilterValues = useDebouncedCallback((values: typeof filterValues) => {
    void setPage(1);
    void setFilterValues(values);
  }, debounceMs);

  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return Object.entries(filterValues).reduce<ColumnFiltersState>((filters, [key, value]) => {
      if (value === null) return filters;

      const column = filterableColumns.find((col) => col.id === key);
      const variant = column?.meta?.variant;
      const isFaceted = !!(column?.meta?.options || column?.meta?.asyncOptions);
      const isDate = variant === 'date' || variant === 'dateRange';
      const isRange = variant === 'range';

      if (isRange) {
        const parts = (Array.isArray(value) ? value : String(value).split(ARRAY_SEPARATOR)).map(
          Number
        );
        if (parts.length >= 2 && parts.every(Number.isFinite)) {
          filters.push({ id: key, value: [parts[0], parts[1]] });
        }
      } else if (isFaceted || isDate) {
        const processedValue = Array.isArray(value)
          ? value
          : typeof value === 'string' && /[^a-zA-Z0-9]/.test(value)
            ? value.split(/[^a-zA-Z0-9]+/).filter(Boolean)
            : [value];
        filters.push({ id: key, value: processedValue });
      } else {
        filters.push({
          id: key,
          value: Array.isArray(value) ? value.join(' ') : value
        });
      }
      return filters;
    }, []);
  }, [filterValues, enableAdvancedFilter, filterableColumns]);

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);

  const onColumnFiltersChange = React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      if (enableAdvancedFilter) return;

      setColumnFilters((prev) => {
        const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;

        const filterUpdates = next.reduce<Record<string, string | string[] | null>>(
          (acc, filter) => {
            if (!filterableColumns.find((column) => column.id === filter.id)) {
              return acc;
            }
            const raw = filter.value;
            if (Array.isArray(raw)) {
              acc[filter.id] = raw.map(String);
            } else if (raw == null || raw === '') {
              acc[filter.id] = null;
            } else {
              acc[filter.id] = String(raw);
            }
            return acc;
          },
          {}
        );

        for (const prevFilter of prev) {
          if (!next.some((filter) => filter.id === prevFilter.id)) {
            filterUpdates[prevFilter.id] = null;
          }
        }

        debouncedSetFilterValues(filterUpdates);
        return next;
      });
    },
    [debouncedSetFilterValues, filterableColumns, enableAdvancedFilter]
  );

  const table = useReactTable({
    ...tableProps,
    columns,
    initialState,
    pageCount,
    meta: {
      ...tableProps.meta,
      ...(isLoading !== undefined ? { isLoading } : {})
    },
    state: {
      pagination,
      sorting,
      columnVisibility,
      columnPinning,
      rowSelection,
      columnFilters
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true
  });

  return { table, shallow, debounceMs, throttleMs };
}
