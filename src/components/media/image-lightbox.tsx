'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog';
import { isPreviewableImageSrc } from '@/lib/media';
import { cn } from '@/lib/utils';
import type {
  ImageLightboxOpenChangeDetails,
  ImageLightboxProps
} from '@/types/media';

function suppressUnderlyingPointerBriefly() {
  const swallow = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const opts: AddEventListenerOptions = { capture: true };
  document.addEventListener('click', swallow, opts);
  document.addEventListener('pointerup', swallow, opts);
  document.addEventListener('mouseup', swallow, opts);
  window.setTimeout(() => {
    document.removeEventListener('click', swallow, opts);
    document.removeEventListener('pointerup', swallow, opts);
    document.removeEventListener('mouseup', swallow, opts);
  }, 50);
}

export function ImageLightbox({ src, alt, open, onOpenChange }: ImageLightboxProps) {
  const t = useTranslations();
  const canPreview = isPreviewableImageSrc(src);

  const handleOpenChange = (
    nextOpen: boolean,
    eventDetails?: ImageLightboxOpenChangeDetails
  ) => {
    if (!nextOpen && eventDetails?.reason === 'outside-press') {
      suppressUnderlyingPointerBriefly();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open && canPreview} onOpenChange={handleOpenChange}>
      <DialogContent
        data-image-lightbox=''
        className={cn(
          'z-[100] max-h-[min(92dvh,960px)] w-[min(96vw,960px)] max-w-none overflow-hidden bg-background/95 p-2 sm:max-w-none sm:p-3'
        )}
        overlayClassName='z-[100]'
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
