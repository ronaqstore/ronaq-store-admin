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
import { storeSettingsKeys } from './queries';
import type { UpdateStoreSettingsInput } from '@/types/store-settings';

export function useUpdateStoreSettings() {
  const t = useTranslations('storeSettings');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateStoreSettingsInput) => updateStoreSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeSettingsKeys.all });
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
      queryClient.invalidateQueries({ queryKey: storeSettingsKeys.all });
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
      queryClient.invalidateQueries({ queryKey: storeSettingsKeys.all });
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
      queryClient.invalidateQueries({ queryKey: storeSettingsKeys.all });
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
      queryClient.invalidateQueries({ queryKey: storeSettingsKeys.all });
      toast.success(t('bannerRemoved'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('bannerRemoveFailed'));
    }
  });
}
