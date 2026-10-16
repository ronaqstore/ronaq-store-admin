import { queryOptions } from '@tanstack/react-query';
import { getStoreSettings } from './service';

export const storeSettingsKeys = {
  all: ['store-settings'] as const,
  detail: () => [...storeSettingsKeys.all, 'detail'] as const
};

export function storeSettingsQueryOptions() {
  return queryOptions({
    queryKey: storeSettingsKeys.detail(),
    queryFn: getStoreSettings
  });
}
