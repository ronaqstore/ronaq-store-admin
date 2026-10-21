'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { formatEmpty } from '@/lib/format-empty';
import { formatPkMobileLocal } from '@/lib/auth/phone';
import { formatOpeningHoursDisplay } from '@/lib/opening-hours';
import { useT } from '@/i18n/use-t';
import type { StoreProfileDetailRow } from '@/types/store-settings';
import { storeSettingsQueryOptions } from '../api/queries';
import { useUpdateStoreSettings } from '../api/mutations';
import { EditStoreProfileDialog } from './edit-store-profile-dialog';
import { StoreBrandingCard } from './store-branding-card';

export function StoreSettingsForm() {
  const t = useT();
  const { data } = useSuspenseQuery(storeSettingsQueryOptions());
  const updateMutation = useUpdateStoreSettings();
  const [profileOpen, setProfileOpen] = useState(false);
  const [enabledConfirm, setEnabledConfirm] = useState<boolean | null>(null);

  const profileRows: StoreProfileDetailRow[] = [
    { label: t('storeSettings.displayName'), value: formatEmpty(data.displayName) },
    { label: t('storeSettings.city'), value: formatEmpty(data.city) },
    {
      label: t('storeSettings.phone'),
      value: formatEmpty(formatPkMobileLocal(data.phoneNumber) || null)
    },
    {
      label: t('storeSettings.whatsapp'),
      value: formatEmpty(formatPkMobileLocal(data.whatsappNumber) || null)
    },
    { label: t('storeSettings.address'), value: formatEmpty(data.address) },
    {
      label: t('storeSettings.googleMaps'),
      value:
        data.latitude != null && data.longitude != null
          ? `${Number(data.latitude).toFixed(5)}, ${Number(data.longitude).toFixed(5)}`
          : formatEmpty(null)
    },
    {
      label: t('storeSettings.openingHours'),
      value: formatEmpty(formatOpeningHoursDisplay(data.openingHours))
    },
    { label: t('storeSettings.about'), value: formatEmpty(data.about) }
  ];

  const confirmEnabledChange = () => {
    if (enabledConfirm == null) return;
    updateMutation.mutate(
      { isEnabled: enabledConfirm },
      { onSettled: () => setEnabledConfirm(null) }
    );
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
          enabledConfirm
            ? t('storeSettings.enableConfirmLabel')
            : t('storeSettings.disableConfirmLabel')
        }
        confirmVariant={enabledConfirm ? 'default' : 'destructive'}
      />
      <div className='grid gap-4 lg:grid-cols-2'>
        <StoreBrandingCard settings={data} />

        <Card className='min-w-0 lg:col-span-2'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>{t('storeSettings.visibilityTitle')}</CardTitle>
            <CardDescription>{t('storeSettings.visibilityDescription')}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0'>
            <div className='flex items-center justify-between gap-4 rounded-lg border p-3.5'>
              <div className='min-w-0'>
                <p className='text-sm font-medium'>{t('storeSettings.enableStore')}</p>
                <p className='text-muted-foreground text-xs'>{t('storeSettings.enableHint')}</p>
              </div>
              <Switch
                checked={Boolean(data.isEnabled)}
                onCheckedChange={(checked) => setEnabledConfirm(checked)}
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
                onCheckedChange={(checked) =>
                  updateMutation.mutate({ showExactStock: checked })
                }
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
            <Button type='button' variant='outline' size='sm' onClick={() => setProfileOpen(true)}>
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
