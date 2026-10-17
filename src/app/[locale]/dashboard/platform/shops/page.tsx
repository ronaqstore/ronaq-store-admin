import PageContainer from '@/components/layout/page-container';
import {
  CreateShopHeaderAction,
  PlatformShopsListClient
} from '@/features/platform-admin/components/shops-page-client';
import { platformShopsQueryOptions } from '@/features/platform-admin/api/queries';
import { DUKAAN_DEFAULT_PAGE_SIZE } from '@/components/data-table/list-params';
import { getQueryClient } from '@/lib/query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('shopManagement')
  };
}

export default async function PlatformShopsPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(
    platformShopsQueryOptions({
      page: 1,
      pageSize: DUKAAN_DEFAULT_PAGE_SIZE,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  );

  return (
    <PageContainer
      fill
      pageTitle='pages.shops.title'
      pageDescription='platform.shopsPageDescription'
      pageHeaderAction={<CreateShopHeaderAction />}
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Skeleton className='h-96 w-full rounded-xl' />}>
          <PlatformShopsListClient />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
