import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { PrefetchHydrationBoundary } from '@/lib/dashboard/prefetch-hydration';
import { ShopSettings } from '@/components/settings/shop-settings';
import { SettingsPageSkeleton } from '@/components/settings/settings-page-skeleton';
import { storeSettingsQueryOptions } from '@/features/store-settings';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('settings')
  };
}

export default function StoreSettingsPage() {
  return (
    <PageContainer
      pageTitle='pages.settings.title'
      pageDescription='pages.settings.description'
    >
      <PrefetchHydrationBoundary
        prefetch={(token, qc) => qc.prefetchQuery(storeSettingsQueryOptions(token))}
        fallback={<SettingsPageSkeleton />}
      >
        <Suspense fallback={<SettingsPageSkeleton />}>
          <ShopSettings />
        </Suspense>
      </PrefetchHydrationBoundary>
    </PageContainer>
  );
}
