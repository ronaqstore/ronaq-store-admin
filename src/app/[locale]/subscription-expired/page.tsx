import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SubscriptionExpiredCard } from './subscription-expired-card';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('subscription');
  return {
    title: t('expiredTitle'),
    description: t('expiredDescriptionGeneral')
  };
}

export default async function SubscriptionExpiredPage() {
  const tm = await getTranslations('metadata');

  return (
    <div className='bg-background relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-4 sm:p-6'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.7_0.05_250_/_0.12),transparent_55%)]'
      />
      <div className='relative z-10 mb-6 text-center'>
        <p className='text-muted-foreground text-xs sm:text-sm font-medium tracking-wide uppercase'>
          {tm('dukaanPro')}
        </p>
      </div>
      <div className='relative z-10 w-full max-w-lg'>
        <Suspense fallback={<div className='bg-muted h-96 animate-pulse rounded-2xl' />}>
          <SubscriptionExpiredCard />
        </Suspense>
      </div>
    </div>
  );
}
