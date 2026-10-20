'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ProductPhotoManager } from './product-photo-manager';
import type { ProductFormSidebarProps } from '@/types/products';

export function ProductFormSidebar({
  productId,
  images,
  onImagesChange,
  onAddPendingFile,
  onRemovePendingFile,
  saving,
  isEdit,
  onCancel,
  labels,
  fields
}: ProductFormSidebarProps) {
  return (
    <div className='space-y-8 lg:col-span-1'>
      <section className='space-y-3'>
        <h2 className='text-base font-semibold'>{labels.images}</h2>
        <ProductPhotoManager
          productId={productId}
          images={images}
          onChange={onImagesChange}
          onAddPendingFile={onAddPendingFile}
          onRemovePendingFile={onRemovePendingFile}
        />
      </section>

      <section className='space-y-3 border-t border-border/60 pt-6'>
        <h2 className='text-base font-semibold'>{labels.onlineStoreSettings}</h2>
        {fields.isPublished}
        {fields.contactForPrice}
        {fields.publicDescription}
      </section>

      <div className='space-y-2 border-t border-border/60 pt-6'>
        <Button type='submit' className='w-full' disabled={saving}>
          {saving ? (
            <Icons.spinner className='me-2 size-4 animate-spin' />
          ) : (
            <Icons.check className='me-2 size-4' />
          )}
          {isEdit ? labels.save : labels.add}
        </Button>
        <Button
          type='button'
          variant='outline'
          className='w-full'
          disabled={saving}
          onClick={onCancel}
        >
          {labels.cancel}
        </Button>
      </div>
    </div>
  );
}
