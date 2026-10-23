import { apiRequest } from '@/lib/api/client';
import type {
  PaginatedResponse,
  ProductDTO,
  ProductListFilters,
  CreateProductInput,
  UpdateProductInput,
  ProductImageDTO
} from '@/lib/api/types';
import type {
  ProductImageListResponse,
  ProductImageReorderItem,
  CreateProductResult,
  CreateProductApiResponse,
  PendingProductImageFile
} from '@/types';
import { appFetch } from '@/lib/api/app-fetch';

import { buildQueryString } from '@/lib/api/query-params';

export async function listProducts(
  filters: ProductListFilters = {},
  token?: string
): Promise<PaginatedResponse<ProductDTO>> {
  const qs = buildQueryString(filters as Record<string, unknown>);

  if (token) {
    return apiRequest<PaginatedResponse<ProductDTO>>(`/products${qs}`, undefined, token);
  }

  return appFetch<PaginatedResponse<ProductDTO>>(`/api/products${qs}`);
}

export async function getProduct(id: string, token?: string): Promise<ProductDTO> {
  if (token) {
    return apiRequest<ProductDTO>(`/products/${id}`, undefined, token);
  }
  return appFetch<ProductDTO>(`/api/products/${id}`);
}

export async function createProduct(input: CreateProductInput): Promise<CreateProductResult> {
  const res = await appFetch<CreateProductApiResponse>('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return {
    id: res.data?.id || res.id,
    message: res.message
  };
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<ProductDTO> {
  return appFetch<ProductDTO>(`/api/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function deactivateProduct(id: string): Promise<ProductDTO> {
  return updateProduct(id, { isActive: false });
}

export async function reactivateProduct(id: string): Promise<ProductDTO> {
  return updateProduct(id, { isActive: true });
}

export async function listProductImages(
  productId: string,
  token?: string
): Promise<ProductImageListResponse> {
  if (token) {
    return apiRequest<ProductImageListResponse>(`/products/${productId}/images`, undefined, token);
  }
  return appFetch<ProductImageListResponse>(`/api/products/${productId}/images`);
}

export async function uploadProductImage(productId: string, file: File): Promise<ProductImageDTO> {
  const formData = new FormData();
  formData.append('image', file);
  return appFetch<ProductImageDTO>(`/api/products/${productId}/images`, {
    method: 'POST',
    body: formData
  });
}

export async function reorderProductImages(
  productId: string,
  items: ProductImageReorderItem[]
): Promise<unknown> {
  return appFetch<unknown>(`/api/products/${productId}/images/order`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageIds: items.map((item) => item.id) })
  });
}

export async function deleteProductImage(productId: string, imageId: string): Promise<unknown> {
  return appFetch<unknown>(`/api/products/${productId}/images/${imageId}`, {
    method: 'DELETE'
  });
}

export async function uploadPendingProductImages(
  productId: string,
  images: ProductImageDTO[],
  pendingFiles: PendingProductImageFile[]
): Promise<void> {
  if (pendingFiles.length === 0) return;
  for (const img of images) {
    const pending = pendingFiles.find((p) => p.id === img.id);
    if (pending) {
      await uploadProductImage(productId, pending.file);
    }
  }
}
