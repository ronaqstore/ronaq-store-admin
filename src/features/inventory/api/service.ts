import { apiRequest } from '@/lib/api/client';
import { appFetch } from '@/lib/api/app-fetch';
import type {
  CreateInventoryAdjustmentInput,
  CreateInventoryAdjustmentResult,
  InventoryAdjustmentDTO,
  InventoryItemDTO,
  InventoryUnitDTO,
  PaginatedResponse
} from '@/lib/api/types';
import type {
  InventoryStockFilters,
  InventoryAdjustmentsFilters,
  ListInventoryUnitsExtraOptions,
  InventoryUnitsListFilters
} from '@/types';

import { buildQueryString } from '@/lib/api/query-params';

export async function listInventoryUnits(
  productId: string,
  status?: string,
  search?: string,
  token?: string,
  extra?: ListInventoryUnitsExtraOptions & InventoryUnitsListFilters
): Promise<PaginatedResponse<InventoryUnitDTO>> {
  const qs = buildQueryString({
    productId,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
    ...(extra?.condition ? { condition: extra.condition } : {}),
    ...(extra?.batteryMin != null ? { batteryMin: extra.batteryMin } : {}),
    ...(extra?.page != null ? { page: extra.page } : {}),
    ...(extra?.pageSize != null ? { pageSize: extra.pageSize } : {})
  });
  if (token) {
    return apiRequest<PaginatedResponse<InventoryUnitDTO>>(
      `/inventory/units${qs}`,
      undefined,
      token
    );
  }
  return appFetch<PaginatedResponse<InventoryUnitDTO>>(`/api/inventory/units${qs}`);
}

export async function listInventoryStock(
  filters: InventoryStockFilters = {},
  token?: string
): Promise<PaginatedResponse<InventoryItemDTO>> {
  const qs = buildQueryString({
    ...filters,
    pageSize: filters.pageSize ?? filters.limit
  } as Record<string, unknown>);

  if (token) {
    return apiRequest<PaginatedResponse<InventoryItemDTO>>(
      `/reports/inventory${qs}`,
      undefined,
      token
    );
  }

  return appFetch<PaginatedResponse<InventoryItemDTO>>(`/api/inventory${qs}`);
}

export async function listInventoryAdjustments(
  filters: InventoryAdjustmentsFilters = {},
  token?: string
): Promise<PaginatedResponse<InventoryAdjustmentDTO>> {
  const qs = buildQueryString({
    ...filters,
    pageSize: filters.pageSize ?? filters.limit
  } as Record<string, unknown>);

  if (token) {
    return apiRequest<PaginatedResponse<InventoryAdjustmentDTO>>(
      `/inventory/adjustments${qs}`,
      undefined,
      token
    );
  }

  return appFetch<PaginatedResponse<InventoryAdjustmentDTO>>(`/api/inventory/adjustments${qs}`);
}

export async function createInventoryAdjustment(
  input: CreateInventoryAdjustmentInput
): Promise<CreateInventoryAdjustmentResult> {
  return appFetch<CreateInventoryAdjustmentResult>('/api/inventory/adjustments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}
