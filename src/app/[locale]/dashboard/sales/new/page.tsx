import PageContainer from '@/components/layout/page-container';
import { SalesListClient, salesQueryOptions } from '@/features/sales';
import { customersQueryOptions } from '@/features/customers';
import { productsQueryOptions } from '@/features/products';
import { unitsQueryOptions } from '@/features/dukaan/api/queries';
import { getQueryClient } from '@/lib/query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('saleNew')
  };
}

export default async function Page() {
  const session = await auth();
  const token = session?.accessToken;
  const qc = getQueryClient();

  if (token) {
    await Promise.all([
      qc.prefetchQuery(salesQueryOptions({ limit: 100 }, token)),
      qc.prefetchQuery(productsQueryOptions({ page: 1, pageSize: 100 }, token)),
      qc.prefetchQuery(customersQueryOptions({ limit: 100 }, token)),
      qc.prefetchQuery(unitsQueryOptions())
    ]);
  }

  return (
    <PageContainer fill pageTitle='pages.sales.title' pageDescription='pages.sales.description'>
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense>
          <SalesListClient defaultOpenAdd />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
