import PageContainer from '@/components/layout/page-container';
import {
  SerializedProductUnitsPage,
  inventoryUnitsQueryOptions
} from '@/features/inventory';
import { productQueryOptions } from '@/features/products/api/queries';
import { getQueryClient } from '@/lib/query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import type { IdPageProps } from '@/types';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('inventorySerialized')
  };
}

export default async function Page({ params }: IdPageProps) {
  const { id } = await params;
  const session = await auth();
  const token = session?.accessToken;
  const qc = getQueryClient();

  if (token) {
    await Promise.all([
      qc.prefetchQuery(productQueryOptions(id, token)),
      qc.prefetchQuery(inventoryUnitsQueryOptions(id, 'ALL', undefined, token))
    ]);
  }

  return (
    <PageContainer
      pageTitle='pages.inventorySerialized.title'
      pageDescription='pages.inventorySerialized.description'
    >
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense fallback={<DataTableSkeleton rowCount={5} columnCount={5} />}>
          <SerializedProductUnitsPage productId={id} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
