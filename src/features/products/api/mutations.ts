import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import type { CreateProductInput, UpdateProductInput } from '@/lib/api/types';
import type { ProductImageReorderItem } from '@/types';

import {
  createProduct,
  deleteProductImage,
  reorderProductImages,
  updateProduct,
  uploadProductImage
} from './service';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { PRODUCT_SYNC_DOMAINS } from '@/lib/query/sync-domains';

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => {
      invalidateDomains({ queryClient, domains: PRODUCT_SYNC_DOMAINS });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(id, input),
    onSuccess: () => {
      invalidateDomains({ queryClient, domains: PRODUCT_SYNC_DOMAINS });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}

export function useUploadProductImage(productId: string) {
  const t = useTranslations('dukaan.product');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadProductImage(productId, file),
    onSuccess: () => {
      invalidateDomains({ queryClient, domains: PRODUCT_SYNC_DOMAINS });
      toast.success(t('imageAdded'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}

export function useReorderProductImages(productId: string) {
  const t = useTranslations('dukaan.product');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: ProductImageReorderItem[]) => reorderProductImages(productId, items),
    onSuccess: () => {
      invalidateDomains({ queryClient, domains: PRODUCT_SYNC_DOMAINS });
      toast.success(t('imageReordered'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}

export function useDeleteProductImage(productId: string) {
  const t = useTranslations('dukaan.product');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => deleteProductImage(productId, imageId),
    onSuccess: () => {
      invalidateDomains({ queryClient, domains: PRODUCT_SYNC_DOMAINS });
      toast.success(t('imageRemoved'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}
