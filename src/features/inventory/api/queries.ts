import { queryOptions } from '@tanstack/react-query';
import { listInventoryAdjustments, listInventoryStock, listInventoryUnits } from './service';
import type { InventoryAdjustmentsFilters, InventoryStockFilters } from '@/types';

export const inventoryKeys = {
  all: ['inventory'] as const,
  stock: (filters?: InventoryStockFilters) => [...inventoryKeys.all, 'stock', filters] as const,
  adjustments: (filters?: InventoryAdjustmentsFilters) =>
    [...inventoryKeys.all, 'adjustments', filters] as const,
  movements: (filters?: InventoryAdjustmentsFilters) =>
    [...inventoryKeys.all, 'movements', filters] as const,
  units: (productId: string, status?: string, search?: string) =>
    [...inventoryKeys.all, 'units', productId, status, search] as const
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
  token?: string
) =>
  queryOptions({
    queryKey: inventoryKeys.units(productId, status, search),
    queryFn: () => listInventoryUnits(productId, status, search, token)
  });
