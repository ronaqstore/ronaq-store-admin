import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  removeShopBanner,
  removeShopLogo,
  updateStoreSettings,
  uploadShopBanner,
  uploadShopLogo
} from './service';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { STORE_SETTINGS_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import type { UpdateStoreSettingsInput } from '@/types/store-settings';

export function useUpdateStoreSettings() {
  const t = useTranslations('storeSettings');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateStoreSettingsInput) => updateStoreSettings(input),
    onSuccess: () => {
      invalidateDomains({ queryClient, domains: STORE_SETTINGS_SYNC_DOMAINS });
      toast.success(t('saved'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('saveFailed'));
    }
  });
}

export function useUploadShopLogo() {
  const t = useTranslations('storeSettings');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadShopLogo(file),
    onSuccess: () => {
      invalidateDomains({ queryClient, domains: STORE_SETTINGS_SYNC_DOMAINS });
      toast.success(t('logoUpdated'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('logoUploadFailed'));
    }
  });
}

export function useRemoveShopLogo() {
  const t = useTranslations('storeSettings');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => removeShopLogo(),
    onSuccess: () => {
      invalidateDomains({ queryClient, domains: STORE_SETTINGS_SYNC_DOMAINS });
      toast.success(t('logoRemoved'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('logoRemoveFailed'));
    }
  });
}

export function useUploadShopBanner() {
  const t = useTranslations('storeSettings');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadShopBanner(file),
    onSuccess: () => {
      invalidateDomains({ queryClient, domains: STORE_SETTINGS_SYNC_DOMAINS });
      toast.success(t('bannerUpdated'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('bannerUploadFailed'));
    }
  });
}

export function useRemoveShopBanner() {
  const t = useTranslations('storeSettings');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => removeShopBanner(),
    onSuccess: () => {
      invalidateDomains({ queryClient, domains: STORE_SETTINGS_SYNC_DOMAINS });
      toast.success(t('bannerRemoved'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('bannerRemoveFailed'));
    }
  });
}
