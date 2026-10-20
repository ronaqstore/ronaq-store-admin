'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ImageLightbox } from '@/components/media/image-lightbox';
import { isPreviewableImageSrc } from '@/lib/media';
import { cn } from '@/lib/utils';
import type { PreviewableImageProps } from '@/types/media';

// Never render a <button> here — nesting buttons inside <a>/<Link> breaks hydration.
export function PreviewableImage({
  src,
  alt,
  className,
  imageClassName,
  sizes = '160px',
  priority = false,
  fallbackSrc,
  width,
  height
}: PreviewableImageProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const canPreview = isPreviewableImageSrc(src);
  const displaySrc = canPreview ? src.trim() : (fallbackSrc ?? src ?? '');

  const stopRowActivation = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const openPreview = (event: React.SyntheticEvent) => {
    stopRowActivation(event);
    setOpen(true);
  };

  if (!displaySrc) return null;

  const image =
    width != null && height != null ? (
      <Image
        src={displaySrc}
        alt={alt}
        width={width}
        height={height}
        unoptimized
        priority={priority}
        className={imageClassName}
        sizes={sizes}
      />
    ) : (
      <Image
        src={displaySrc}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        className={imageClassName}
        sizes={sizes}
      />
    );

  if (!canPreview) {
    return <div className={cn('relative overflow-hidden', className)}>{image}</div>;
  }

  return (
    <>
      <div
        data-slot='previewable-image'
        className={cn(
          'relative block overflow-hidden border-0 bg-transparent p-0 cursor-zoom-in',
          className
        )}
        onClick={openPreview}
        onPointerDown={stopRowActivation}
        onMouseDown={stopRowActivation}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            openPreview(event);
          }
        }}
        role='button'
        tabIndex={0}
        aria-label={t('aria.previewImage')}
        suppressHydrationWarning
      >
        {image}
      </div>
      <ImageLightbox src={displaySrc} alt={alt} open={open} onOpenChange={setOpen} />
    </>
  );
}
