import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { listInventoryAdjustments, listInventoryStock, listInventoryUnits } from './service';
import { compactFilters } from '@/lib/api/compact-filters';
import type {
  InventoryAdjustmentsFilters,
  InventoryStockFilters,
  InventoryUnitsListFilters,
  ListInventoryUnitsExtraOptions
} from '@/types';

export const inventoryKeys = {
  all: ['inventory'] as const,
  stock: (filters?: InventoryStockFilters) => [...inventoryKeys.all, 'stock', filters] as const,
  adjustments: (filters?: InventoryAdjustmentsFilters) =>
    [...inventoryKeys.all, 'adjustments', filters] as const,
  movements: (filters?: InventoryAdjustmentsFilters) =>
    [...inventoryKeys.all, 'movements', filters] as const,
  units: (
    productId: string,
    status?: string,
    search?: string,
    page?: number,
    pageSize?: number
  ) => [...inventoryKeys.all, 'units', productId, status, search, page, pageSize] as const
};

export const inventoryStockQueryOptions = (filters: InventoryStockFilters = {}, token?: string) => {
  const compact = compactFilters(filters as Record<string, unknown>) as InventoryStockFilters;
  return queryOptions({
    queryKey: inventoryKeys.stock(compact),
    queryFn: () => listInventoryStock(compact, token),
    placeholderData: keepPreviousData
  });
};

export const inventoryAdjustmentsQueryOptions = (
  filters: InventoryAdjustmentsFilters = {},
  token?: string
) => {
  const compact = compactFilters(filters as Record<string, unknown>) as InventoryAdjustmentsFilters;
  return queryOptions({
    queryKey: inventoryKeys.adjustments(compact),
    queryFn: () => listInventoryAdjustments(compact, token),
    placeholderData: keepPreviousData
  });
};

export const inventoryUnitsQueryOptions = (
  productId: string,
  status?: string,
  search?: string,
  token?: string,
  extra?: ListInventoryUnitsExtraOptions & InventoryUnitsListFilters
) =>
  queryOptions({
    queryKey: inventoryKeys.units(
      productId,
      status,
      search,
      extra?.page,
      extra?.pageSize
    ),
    queryFn: () => listInventoryUnits(productId, status, search, token, extra)
  });
