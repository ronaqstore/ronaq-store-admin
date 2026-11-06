import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
  getDeadStockReport,
  listInventoryAdjustments,
  listInventoryStock,
  listInventoryUnits,
  lookupImei
} from './service';
import { compactFilters } from '@/lib/api/compact-filters';
import type { DeadStockQueryFilters } from '@/lib/api/types';
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
  units: (productId: string, status?: string, search?: string, page?: number, pageSize?: number) =>
    [...inventoryKeys.all, 'units', productId, status, search, page, pageSize] as const,
  imeiLookup: (imei?: string) => [...inventoryKeys.all, 'imeiLookup', imei?.trim()] as const,
  deadStock: (filters?: DeadStockQueryFilters) =>
    [...inventoryKeys.all, 'deadStock', filters] as const
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
    queryKey: inventoryKeys.units(productId, status, search, extra?.page, extra?.pageSize),
    queryFn: () => listInventoryUnits(productId, status, search, token, extra)
  });

export const imeiLookupQueryOptions = (imei?: string, token?: string) =>
  queryOptions({
    queryKey: inventoryKeys.imeiLookup(imei),
    queryFn: () => (imei && imei.trim().length > 0 ? lookupImei(imei.trim(), token) : null),
    enabled: Boolean(imei && imei.trim().length > 0)
  });

export const deadStockReportQueryOptions = (
  filters: DeadStockQueryFilters = {},
  token?: string
) => {
  const compact = compactFilters(filters as Record<string, unknown>) as DeadStockQueryFilters;
  return queryOptions({
    queryKey: inventoryKeys.deadStock(compact),
    queryFn: () => getDeadStockReport(compact, token),
    placeholderData: keepPreviousData
  });
};
