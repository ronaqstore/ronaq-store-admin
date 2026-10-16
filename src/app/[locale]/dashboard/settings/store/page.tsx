import PageContainer from '@/components/layout/page-container';
import { PrefetchHydrationBoundary } from '@/lib/dashboard/prefetch-hydration';
import { StoreSettingsForm, storeSettingsQueryOptions } from '@/features/store-settings';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('storeSettings')
  };
}

function StoreSettingsSkeleton() {
  return (
    <div className='mx-auto grid max-w-4xl gap-6'>
      <Skeleton className='h-40 w-full rounded-xl' />
      <Skeleton className='h-96 w-full rounded-xl' />
    </div>
  );
}

export default function StoreSettingsPage() {
  return (
    <PageContainer
      pageTitle='pages.storeSettings.title'
      pageDescription='pages.storeSettings.description'
    >
      <PrefetchHydrationBoundary
        prefetch={(token, qc) => qc.prefetchQuery(storeSettingsQueryOptions(token))}
        fallback={<StoreSettingsSkeleton />}
      >
        <StoreSettingsForm />
      </PrefetchHydrationBoundary>
    </PageContainer>
  );
}
