import { queryOptions } from '@tanstack/react-query';
import { listInventoryAdjustments, listInventoryStock, listInventoryUnits } from './service';
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

export const inventoryStockQueryOptions = (filters: InventoryStockFilters = {}, token?: string) =>
  queryOptions({
    queryKey: inventoryKeys.stock(filters),
    queryFn: () => listInventoryStock(filters, token)
  });

export const inventoryAdjustmentsQueryOptions = (
  filters: InventoryAdjustmentsFilters = {},
  token?: string
) =>
  queryOptions({
    queryKey: inventoryKeys.adjustments(filters),
    queryFn: () => listInventoryAdjustments(filters, token)
  });

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
