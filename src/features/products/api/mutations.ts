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
import { productsQueryKeys } from './queries';

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
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
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id) });
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
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.imageList(productId) });
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
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.imageList(productId) });
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
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.imageList(productId) });
      toast.success(t('imageRemoved'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}
