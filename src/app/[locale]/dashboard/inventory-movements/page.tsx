import PageContainer from '@/components/layout/page-container';
import { InventoryMovementsClient, inventoryAdjustmentsQueryOptions } from '@/features/inventory';
import { getQueryClient } from '@/lib/query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('inventoryMovements')
  };
}

export default async function Page() {
  const session = await auth();
  const token = session?.accessToken;
  const qc = getQueryClient();

  if (token) {
    await qc.prefetchQuery(
      inventoryAdjustmentsQueryOptions(
        { page: 1, pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' },
        token
      )
    );
  }

  return (
    <PageContainer
      fill
      pageTitle='pages.movements.title'
      pageDescription='pages.movements.description'
    >
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense>
          <InventoryMovementsClient />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
