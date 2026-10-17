import { apiRequest } from '@/lib/api/client';
import type { PaginatedResponse, CategoryDTO } from '@/lib/api/types';
import type { CategoryListFilters, UpdateCategoryArg } from '@/types';
import { appFetch } from '@/lib/api/app-fetch';

import { buildQueryString } from '@/lib/api/query-params';

export async function listCategories(
  filters: CategoryListFilters = {},
  token?: string
): Promise<PaginatedResponse<CategoryDTO>> {
  const qs = buildQueryString(filters as Record<string, unknown>);

  if (token) {
    return apiRequest<PaginatedResponse<CategoryDTO>>(`/categories${qs}`, undefined, token);
  }

  return appFetch<PaginatedResponse<CategoryDTO>>(`/api/categories${qs}`);
}

export async function createCategory(name: string): Promise<CategoryDTO> {
  return appFetch<CategoryDTO>('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
}

export async function updateCategory(id: string, input: UpdateCategoryArg): Promise<CategoryDTO> {
  const body = typeof input === 'string' ? { name: input } : input;
  return appFetch<CategoryDTO>(`/api/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export async function deactivateCategory(id: string): Promise<CategoryDTO> {
  return updateCategory(id, { isActive: false });
}

export async function reactivateCategory(id: string): Promise<CategoryDTO> {
  return updateCategory(id, { isActive: true });
}
