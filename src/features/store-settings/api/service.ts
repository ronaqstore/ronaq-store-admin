import { apiRequest } from '@/lib/api/client';
import { appFetch } from '@/lib/api/app-fetch';
import type { StoreSettingsDTO, UpdateStoreSettingsInput } from '@/types/store-settings';

export async function getStoreSettings(): Promise<StoreSettingsDTO> {
  return appFetch<StoreSettingsDTO>('/api/store/settings');
}

export async function updateStoreSettings(
  input: UpdateStoreSettingsInput
): Promise<unknown> {
  return appFetch<unknown>('/api/store/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function uploadShopLogo(file: File, token?: string): Promise<unknown> {
  const formData = new FormData();
  formData.append('image', file);

  if (token) {
    return apiRequest<unknown>(
      '/store/settings/logo',
      { method: 'POST', body: formData },
      token
    );
  }

  return appFetch<unknown>('/api/store/settings/logo', {
    method: 'POST',
    body: formData
  });
}

export async function removeShopLogo(): Promise<unknown> {
  return appFetch<unknown>('/api/store/settings/logo', {
    method: 'DELETE'
  });
}
