'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog';
import { isPreviewableImageSrc } from '@/lib/media';
import type { ImageLightboxProps } from '@/types/media';

export function ImageLightbox({ src, alt, open, onOpenChange }: ImageLightboxProps) {
  const t = useTranslations();
  const canPreview = isPreviewableImageSrc(src);

  return (
    <Dialog open={open && canPreview} onOpenChange={onOpenChange}>
      <DialogContent
        className='max-h-[min(92dvh,960px)] w-[min(96vw,960px)] max-w-none overflow-hidden bg-background/95 p-2 sm:max-w-none sm:p-3'
        closeLabel={t('common.close')}
      >
        <DialogTitle className='sr-only'>{alt}</DialogTitle>
        {canPreview ? (
          <div className='relative mx-auto h-[min(80dvh,820px)] w-full'>
            <Image
              src={src.trim()}
              alt={alt}
              fill
              unoptimized
              className='object-contain'
              sizes='(max-width: 1024px) 96vw, 960px'
              priority
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
