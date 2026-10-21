'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { PreviewableImage } from '@/components/media/previewable-image';
import { PLACEHOLDER_SHOP_LOGO } from '@/constants/placeholders';
import { formatEmpty } from '@/lib/format-empty';
import { prepareShopBanner, prepareShopLogo } from '@/lib/prepare-image';
import { useT } from '@/i18n/use-t';
import type { StoreBrandingCardProps } from '@/types/store-branding';
import {
  useRemoveShopBanner,
  useRemoveShopLogo,
  useUploadShopBanner,
  useUploadShopLogo
} from '../api/mutations';

export function StoreBrandingCard({ settings }: StoreBrandingCardProps) {
  const t = useT();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const uploadLogoMutation = useUploadShopLogo();
  const removeLogoMutation = useRemoveShopLogo();
  const uploadBannerMutation = useUploadShopBanner();
  const removeBannerMutation = useRemoveShopBanner();
  const [logoPreparing, setLogoPreparing] = useState(false);
  const [bannerPreparing, setBannerPreparing] = useState(false);

  const handleLogoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLogoPreparing(true);
      const prepared = await prepareShopLogo(file);
      uploadLogoMutation.mutate(prepared, {
        onSettled: () => {
          setLogoPreparing(false);
          if (logoInputRef.current) logoInputRef.current.value = '';
        }
      });
    } catch {
      setLogoPreparing(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleBannerSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBannerPreparing(true);
      const prepared = await prepareShopBanner(file);
      uploadBannerMutation.mutate(prepared, {
        onSettled: () => {
          setBannerPreparing(false);
          if (bannerInputRef.current) bannerInputRef.current.value = '';
        }
      });
    } catch {
      setBannerPreparing(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  return (
    <Card className='min-w-0 lg:col-span-2'>
      <CardHeader className='space-y-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <CardTitle className='text-base'>{t('storeSettings.brandingTitle')}</CardTitle>
          <Badge variant={settings.isEnabled ? 'default' : 'secondary'}>
            {settings.isEnabled ? t('status.active') : t('status.inactive')}
          </Badge>
        </div>
        <CardDescription>{t('storeSettings.brandingHint')}</CardDescription>
        <p className='text-muted-foreground pt-1 text-xs'>
          {t('storeSettings.slugLabel')}:{' '}
          <span className='text-foreground font-medium'>{formatEmpty(settings.slug)}</span>
        </p>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='space-y-3'>
          <div className='space-y-1'>
            <p className='text-sm font-medium'>{t('storeSettings.bannerTitle')}</p>
            <p className='text-muted-foreground text-xs'>{t('storeSettings.bannerHint')}</p>
          </div>
          <div className='relative h-36 overflow-hidden rounded-xl border bg-muted sm:h-44 md:h-52'>
            {settings.bannerUrl ? (
              <PreviewableImage
                src={settings.bannerUrl}
                alt={t('storeSettings.bannerTitle')}
                className='absolute inset-0 h-full w-full'
                imageClassName='object-cover'
                sizes='(max-width: 768px) 100vw, 800px'
              />
            ) : (
              <div className='absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/10 to-muted' />
            )}
            <div className='absolute bottom-3 inset-s-3'>
              <PreviewableImage
                src={settings.logoUrl}
                alt={formatEmpty(settings.displayName)}
                className='relative h-16 w-16 overflow-hidden rounded-full border-4 border-background bg-card shadow-md sm:h-20 sm:w-20'
                imageClassName='object-cover'
                sizes='80px'
                fallbackSrc={PLACEHOLDER_SHOP_LOGO}
              />
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => bannerInputRef.current?.click()}
              isLoading={bannerPreparing || uploadBannerMutation.isPending}
            >
              <Icons.upload className='me-2 h-4 w-4' />
              {settings.bannerUrl
                ? t('storeSettings.changeBanner')
                : t('storeSettings.uploadBanner')}
            </Button>
            {settings.bannerUrl ? (
              <Button
                type='button'
                variant='ghost'
                onClick={() => removeBannerMutation.mutate()}
                isLoading={removeBannerMutation.isPending}
              >
                {t('storeSettings.removeBanner')}
              </Button>
            ) : null}
            <input
              ref={bannerInputRef}
              type='file'
              accept='image/jpeg,image/png,image/webp'
              className='hidden'
              onChange={handleBannerSelect}
            />
          </div>
        </div>

        <div className='space-y-3 border-t pt-4'>
          <div className='space-y-1'>
            <p className='text-sm font-medium'>{t('storeSettings.logoTitle')}</p>
            <p className='text-muted-foreground text-xs'>{t('storeSettings.logoHint')}</p>
          </div>
          <div className='flex flex-wrap items-center gap-3'>
            <PreviewableImage
              src={settings.logoUrl}
              alt={formatEmpty(settings.displayName)}
              className='relative h-20 w-20 shrink-0 overflow-hidden rounded-full border bg-muted shadow-sm'
              imageClassName='object-cover'
              sizes='80px'
              fallbackSrc={PLACEHOLDER_SHOP_LOGO}
            />
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => logoInputRef.current?.click()}
                isLoading={logoPreparing || uploadLogoMutation.isPending}
              >
                <Icons.upload className='me-2 h-4 w-4' />
                {settings.logoUrl
                  ? t('storeSettings.changeLogo')
                  : t('storeSettings.uploadLogo')}
              </Button>
              {settings.logoUrl ? (
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => removeLogoMutation.mutate()}
                  isLoading={removeLogoMutation.isPending}
                >
                  {t('storeSettings.removeLogo')}
                </Button>
              ) : null}
              <input
                ref={logoInputRef}
                type='file'
                accept='image/jpeg,image/png,image/webp'
                className='hidden'
                onChange={handleLogoSelect}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
