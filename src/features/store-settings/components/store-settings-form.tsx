'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/icons';
import { PreviewableImage } from '@/components/media/previewable-image';
import { AlertModal } from '@/components/modal/alert-modal';
import { PLACEHOLDER_SHOP_LOGO } from '@/constants/placeholders';
import { formatEmpty } from '@/lib/format-empty';
import { useT } from '@/i18n/use-t';
import type { StoreProfileDetailRow } from '@/types/store-settings';
import { storeSettingsQueryOptions } from '../api/queries';
import {
  useRemoveShopLogo,
  useUpdateStoreSettings,
  useUploadShopLogo
} from '../api/mutations';
import { EditStoreProfileDialog } from './edit-store-profile-dialog';

export function StoreSettingsForm() {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data } = useSuspenseQuery(storeSettingsQueryOptions());
  const updateMutation = useUpdateStoreSettings();
  const uploadMutation = useUploadShopLogo();
  const removeMutation = useRemoveShopLogo();
  const [profileOpen, setProfileOpen] = useState(false);
  const [enabledConfirm, setEnabledConfirm] = useState<boolean | null>(null);

  const profileRows: StoreProfileDetailRow[] = [
    { label: t('storeSettings.displayName'), value: formatEmpty(data.displayName) },
    { label: t('storeSettings.city'), value: formatEmpty(data.city) },
    { label: t('storeSettings.phone'), value: formatEmpty(data.phoneNumber) },
    { label: t('storeSettings.whatsapp'), value: formatEmpty(data.whatsappNumber) },
    { label: t('storeSettings.address'), value: formatEmpty(data.address) },
    { label: t('storeSettings.openingHours'), value: formatEmpty(data.openingHours) },
    { label: t('storeSettings.about'), value: formatEmpty(data.about) },
    { label: t('storeSettings.googleMaps'), value: formatEmpty(data.googleMapsUrl) }
  ];

  const handleLogoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file, {
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handlePickLogo = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    removeMutation.mutate();
  };

  const handleEnabledChange = (checked: boolean) => {
    setEnabledConfirm(checked);
  };

  const confirmEnabledChange = () => {
    if (enabledConfirm == null) return;
    updateMutation.mutate(
      { isEnabled: enabledConfirm },
      { onSettled: () => setEnabledConfirm(null) }
    );
  };

  const handleExactStockChange = (checked: boolean) => {
    updateMutation.mutate({ showExactStock: checked });
  };

  const openProfileDialog = () => {
    setProfileOpen(true);
  };

  return (
    <>
      <AlertModal
        isOpen={enabledConfirm != null}
        onClose={() => setEnabledConfirm(null)}
        onConfirm={confirmEnabledChange}
        loading={updateMutation.isPending}
        title={
          enabledConfirm
            ? t('storeSettings.enableConfirmTitle')
            : t('storeSettings.disableConfirmTitle')
        }
        description={
          enabledConfirm
            ? t('storeSettings.enableConfirmDescription')
            : t('storeSettings.disableConfirmDescription')
        }
        confirmLabel={
          enabledConfirm ? t('storeSettings.enableConfirmLabel') : t('storeSettings.disableConfirmLabel')
        }
        confirmVariant={enabledConfirm ? 'default' : 'destructive'}
      />
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='min-w-0'>
          <CardHeader className='flex flex-row items-start gap-4 space-y-0'>
            <PreviewableImage
              src={data.logoUrl}
              alt={formatEmpty(data.displayName)}
              className='relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-muted shadow-sm'
              imageClassName='object-cover'
              sizes='80px'
              fallbackSrc={PLACEHOLDER_SHOP_LOGO}
            />
            <div className='min-w-0 flex-1 space-y-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <CardTitle className='text-base'>{t('storeSettings.logoTitle')}</CardTitle>
                <Badge variant={data.isEnabled ? 'default' : 'secondary'}>
                  {data.isEnabled ? t('status.active') : t('status.inactive')}
                </Badge>
              </div>
              <CardDescription>{t('storeSettings.logoHint')}</CardDescription>
              <p className='text-muted-foreground pt-1 text-xs'>
                {t('storeSettings.slugLabel')}:{' '}
                <span className='text-foreground font-medium'>{formatEmpty(data.slug)}</span>
              </p>
            </div>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handlePickLogo}
              isLoading={uploadMutation.isPending}
            >
              <Icons.upload className='me-2 h-4 w-4' />
              {data.logoUrl ? t('storeSettings.changeLogo') : t('storeSettings.uploadLogo')}
            </Button>
            {data.logoUrl ? (
              <Button
                type='button'
                variant='ghost'
                onClick={handleRemoveLogo}
                isLoading={removeMutation.isPending}
              >
                {t('storeSettings.removeLogo')}
              </Button>
            ) : null}
            <input
              ref={fileInputRef}
              type='file'
              accept='image/jpeg,image/png,image/webp'
              className='hidden'
              onChange={handleLogoSelect}
            />
          </CardContent>
        </Card>

        <Card className='min-w-0'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>{t('storeSettings.visibilityTitle')}</CardTitle>
            <CardDescription>{t('storeSettings.visibilityDescription')}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-center justify-between gap-4 rounded-lg border p-3.5'>
              <div className='min-w-0'>
                <p className='text-sm font-medium'>{t('storeSettings.enableStore')}</p>
                <p className='text-muted-foreground text-xs'>{t('storeSettings.enableHint')}</p>
              </div>
              <Switch
                checked={Boolean(data.isEnabled)}
                onCheckedChange={handleEnabledChange}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className='flex items-center justify-between gap-4 rounded-lg border p-3.5'>
              <div className='min-w-0'>
                <p className='text-sm font-medium'>{t('storeSettings.showExactStock')}</p>
                <p className='text-muted-foreground text-xs'>
                  {t('storeSettings.showExactStockHint')}
                </p>
              </div>
              <Switch
                checked={Boolean(data.showExactStock)}
                onCheckedChange={handleExactStockChange}
                disabled={updateMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>

        <Card className='min-w-0 lg:col-span-2'>
          <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
            <div className='space-y-1'>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Icons.building className='h-4 w-4' />
                {t('storeSettings.profileTitle')}
              </CardTitle>
              <CardDescription>{t('storeSettings.profileCardDescription')}</CardDescription>
            </div>
            <Button type='button' variant='outline' size='sm' onClick={openProfileDialog}>
              <Icons.edit className='me-2 h-4 w-4' />
              {t('storeSettings.editProfile')}
            </Button>
          </CardHeader>
          <CardContent>
            <dl className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              {profileRows.map((row) => (
                <div
                  key={row.label}
                  className='bg-muted/40 rounded-lg border px-3 py-3 xl:[&:nth-last-child(-n+2)]:col-span-2'
                >
                  <dt className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                    {row.label}
                  </dt>
                  <dd className='mt-1 break-words text-sm font-medium'>{row.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      <EditStoreProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        settings={data}
      />
    </>
  );
}
