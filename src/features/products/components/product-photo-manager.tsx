'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { IconPlus, IconTrash, IconUpload } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { PreviewableImage } from '@/components/media/previewable-image';
import { Icons } from '@/components/icons';
import { AppError } from '@/lib/errors';
import { prepareProductImage } from '@/lib/prepare-image';
import { productImagesQueryOptions } from '../api/queries';

import {
  useDeleteProductImage,
  useReorderProductImages,
  useUploadProductImage
} from '../api/mutations';
import type { ProductImageDTO } from '@/lib/api/types';
import type { ProductImageUploadTask, ProductPhotoManagerProps } from '@/types/products';

const MAX_PRODUCT_IMAGES = 5;

export function ProductPhotoManager({
  productId,
  images,
  onChange,
  onAddPendingFile,
  onRemovePendingFile,
  onUploadsChange
}: ProductPhotoManagerProps) {
  const t = useTranslations('dukaan.product');
  const tCommon = useTranslations('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const reservedSlotsRef = useRef(0);
  const imageCountRef = useRef(images.length);
  const [uploadTasks, setUploadTasks] = useState<ProductImageUploadTask[]>([]);

  const uploadMutation = useUploadProductImage(productId ?? '');
  const deleteMutation = useDeleteProductImage(productId ?? '');
  const reorderMutation = useReorderProductImages(productId ?? '');

  useEffect(() => {
    imageCountRef.current = images.length;
  }, [images.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (selectedFiles.length === 0) return;

    const availableSlots = Math.max(
      0,
      MAX_PRODUCT_IMAGES - imageCountRef.current - reservedSlotsRef.current
    );
    const acceptedFiles = selectedFiles.slice(0, availableSlots);
    if (acceptedFiles.length < selectedFiles.length) toast.error(t('imageLimitExceeded'));
    if (acceptedFiles.length === 0) return;

    reservedSlotsRef.current += acceptedFiles.length;
    onUploadsChange(true);

    const tasks = acceptedFiles.map((file, index) => ({
      file,
      task: {
        id: `local-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
        previewUrl: URL.createObjectURL(file),
        status: 'queued' as const
      }
    }));
    setUploadTasks((current) => [...current, ...tasks.map(({ task }) => task)]);

    for (const { file, task } of tasks) {
      uploadQueueRef.current = uploadQueueRef.current.then(async () => {
        let prepared = false;
        let uploaded = false;

        try {
          setUploadTasks((current) =>
            current.map((item) => (item.id === task.id ? { ...item, status: 'preparing' } : item))
          );
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            throw new AppError(t('imageTypeError'));
          }
          const resizedFile = await prepareProductImage(file);
          prepared = true;

          if (!productId) {
            const newImage: ProductImageDTO = {
              id: task.id,
              url: task.previewUrl,
              sortOrder: imageCountRef.current
            };
            imageCountRef.current += 1;
            onChange((current) => [...current, newImage]);
            onAddPendingFile?.(resizedFile, task.id);
            return;
          }

          setUploadTasks((current) =>
            current.map((item) => (item.id === task.id ? { ...item, status: 'uploading' } : item))
          );
          await uploadMutation.mutateAsync(resizedFile);
          uploaded = true;
          const refreshedImages = await queryClient.fetchQuery(
            productImagesQueryOptions(productId)
          );
          imageCountRef.current = refreshedImages.items.length;
          onChange(refreshedImages.items);
        } catch (error) {
          URL.revokeObjectURL(task.previewUrl);
          if (!prepared || !productId) {
            toast.error((error as Error).message || t('imageTypeError'));
          } else if (uploaded) {
            void queryClient.invalidateQueries({
              queryKey: productImagesQueryOptions(productId).queryKey
            });
            toast.error((error as Error).message || t('photosUploadFailed'));
          }
        } finally {
          setUploadTasks((current) => current.filter((item) => item.id !== task.id));
          reservedSlotsRef.current = Math.max(0, reservedSlotsRef.current - 1);
          onUploadsChange(reservedSlotsRef.current > 0);
        }
      });
    }
  };

  const handleDelete = (imageId: string) => {
    if (productId) {
      deleteMutation.mutate(imageId);
    } else {
      const removedImage = images.find((img) => img.id === imageId);
      if (removedImage?.url.startsWith('blob:')) URL.revokeObjectURL(removedImage.url);
      imageCountRef.current = Math.max(0, imageCountRef.current - 1);
      onChange((current) => current.filter((img) => img.id !== imageId));
      onRemovePendingFile?.(imageId);
    }
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (uploadTasks.length > 0) return;
    if (toIndex < 0 || toIndex >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    imageCountRef.current = newImages.length;
    onChange(newImages);
    if (productId) {
      reorderMutation.mutate(newImages.map((img, idx) => ({ id: img.id, sortOrder: idx })));
    }
  };

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between gap-3'>
        <div className='min-w-0'>
          <h3 className='text-sm font-medium'>{t('images')}</h3>
          <p className='text-xs text-muted-foreground'>{t('imagesHint')}</p>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='shrink-0'
          onClick={() => fileInputRef.current?.click()}
        >
          <IconPlus className='me-2 h-4 w-4' />
          {t('uploadImage')}
        </Button>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/jpeg,image/png,image/webp'
          multiple
          className='hidden'
          onChange={handleFileSelect}
        />
      </div>
      {uploadTasks.length > 0 ? (
        <p
          role='status'
          aria-live='polite'
          className='flex items-center gap-2 text-xs text-muted-foreground'
        >
          <Icons.spinner className='size-3.5 animate-spin' />
          {t('uploading')} ({uploadTasks.length})
        </p>
      ) : null}
      {images.length === 0 && uploadTasks.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-muted-foreground'>
          <div className='relative mb-3 h-20 w-20 overflow-hidden rounded-lg bg-muted'>
            <Image
              src='/placeholders/product.svg'
              alt=''
              fill
              unoptimized
              className='object-contain p-2'
            />
          </div>
          <p className='text-sm'>{t('noImages')}</p>
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {images.map((image, index) => (
            <div
              key={image.id}
              className='group relative aspect-square overflow-hidden rounded-lg border bg-muted'
            >
              <PreviewableImage
                src={image.url}
                alt={`${t('images')} ${index + 1}`}
                className='relative h-full w-full'
                imageClassName='object-contain p-2'
                sizes='200px'
              />
              <div className='pointer-events-none absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'>
                <Button
                  type='button'
                  variant='secondary'
                  size='icon'
                  className='pointer-events-auto h-8 w-8'
                  aria-label={tCommon('moveUp')}
                  onClick={() => handleMove(index, index - 1)}
                  disabled={index === 0 || reorderMutation.isPending || uploadTasks.length > 0}
                >
                  <IconUpload className='h-4 w-4 rotate-90' />
                </Button>
                <Button
                  type='button'
                  variant='destructive'
                  size='icon'
                  className='pointer-events-auto h-8 w-8'
                  aria-label={tCommon('delete')}
                  onClick={() => handleDelete(image.id)}
                  disabled={deleteMutation.isPending || uploadTasks.length > 0}
                >
                  <IconTrash className='h-4 w-4' />
                </Button>
                <Button
                  type='button'
                  variant='secondary'
                  size='icon'
                  className='pointer-events-auto h-8 w-8'
                  aria-label={tCommon('moveDown')}
                  onClick={() => handleMove(index, index + 1)}
                  disabled={
                    index === images.length - 1 ||
                    reorderMutation.isPending ||
                    uploadTasks.length > 0
                  }
                >
                  <IconUpload className='h-4 w-4 -rotate-90' />
                </Button>
              </div>
              {index === 0 && (
                <div className='absolute inset-s-1 top-1 rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground'>
                  {t('cover')}
                </div>
              )}
            </div>
          ))}
          {uploadTasks.map((task, index) => (
            <div
              key={task.id}
              className='relative aspect-square overflow-hidden rounded-lg border bg-muted'
            >
              <PreviewableImage
                src={task.previewUrl}
                alt={`${t('images')} ${images.length + index + 1}`}
                className='relative h-full w-full'
                imageClassName='object-contain p-2 opacity-60'
                sizes='200px'
              />
              <div
                role='status'
                aria-label={task.status === 'queued' ? t('uploadQueued') : t('uploading')}
                className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/75 text-xs font-medium text-foreground'
              >
                <Icons.spinner className='size-5 animate-spin' />
                {task.status === 'queued' ? t('uploadQueued') : t('uploading')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
