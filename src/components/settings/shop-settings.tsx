'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import { AccountSettings } from '@/features/account/components/account-settings';
import { StoreSettingsForm } from '@/features/store-settings';
import type { SettingsSectionProps } from '@/types';

function StoreSettingsSkeleton() {
  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <Skeleton className='h-52 w-full rounded-xl' />
      <Skeleton className='h-52 w-full rounded-xl' />
      <Skeleton className='h-72 w-full rounded-xl lg:col-span-2' />
    </div>
  );
}

function SettingsSection({ title, description, icon: Icon, children }: SettingsSectionProps) {
  return (
    <section className='space-y-4'>
      <div className='flex items-start gap-3'>
        <div className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'>
          <Icon className='h-5 w-5' />
        </div>
        <div className='min-w-0'>
          <h2 className='text-lg font-semibold tracking-tight'>{title}</h2>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function ShopSettings() {
  const t = useT();

  return (
    <div className='flex min-w-0 flex-col gap-10'>
      <SettingsSection
        title={t('nav.account')}
        description={t('account.subtitle')}
        icon={Icons.account}
      >
        <AccountSettings />
      </SettingsSection>

      <div className='border-border/80 border-t' />

      <SettingsSection
        title={t('nav.storeSettings')}
        description={t('storeSettings.subtitle')}
        icon={Icons.building}
      >
        <Suspense fallback={<StoreSettingsSkeleton />}>
          <StoreSettingsForm />
        </Suspense>
      </SettingsSection>
    </div>
  );
}
