import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { PrefetchHydrationBoundary } from '@/lib/dashboard/prefetch-hydration';
import { ShopSettings } from '@/components/settings/shop-settings';
import { SettingsPageSkeleton } from '@/components/settings/settings-page-skeleton';
import { storeSettingsQueryOptions } from '@/features/store-settings';

export function ShopSettingsPrefetchRoute() {
  return (
    <PageContainer pageTitle='pages.settings.title' pageDescription='pages.settings.description'>
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
