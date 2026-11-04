import { apiRequest } from '@/lib/api/client';
import type { PaginatedResponse, BrandDTO } from '@/lib/api/types';
import type { BrandListFilters, UpdateBrandArg, EntityCreationApiResponse } from '@/types';
import { appFetch } from '@/lib/api/app-fetch';

import { buildQueryString } from '@/lib/api/query-params';

export async function listBrands(
  filters: BrandListFilters = {},
  token?: string
): Promise<PaginatedResponse<BrandDTO>> {
  const qs = buildQueryString(filters as Record<string, unknown>);

  if (token) {
    return apiRequest<PaginatedResponse<BrandDTO>>(`/brands${qs}`, undefined, token);
  }

  return appFetch<PaginatedResponse<BrandDTO>>(`/api/brands${qs}`);
}

export async function createBrand(name: string): Promise<BrandDTO> {
  const res = await appFetch<EntityCreationApiResponse>('/api/brands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return {
    id: res.data?.id || res.id || '',
    name: name.trim(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as BrandDTO;
}

export async function updateBrand(id: string, input: UpdateBrandArg): Promise<BrandDTO> {
  const body = typeof input === 'string' ? { name: input } : input;
  return appFetch<BrandDTO>(`/api/brands/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export async function deactivateBrand(id: string): Promise<BrandDTO> {
  return updateBrand(id, { isActive: false });
}

export async function reactivateBrand(id: string): Promise<BrandDTO> {
  return updateBrand(id, { isActive: true });
}
