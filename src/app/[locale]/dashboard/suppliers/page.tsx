import PageContainer from '@/components/layout/page-container';
import { SuppliersPageClient, suppliersQueryOptions } from '@/features/suppliers';
import { getQueryClient } from '@/lib/query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('suppliers')
  };
}

export default async function Page() {
  const session = await auth();
  const qc = getQueryClient();

  if (session?.accessToken) {
    await qc.prefetchQuery(
      suppliersQueryOptions(
        { page: 1, pageSize: 20, sortBy: 'name', sortOrder: 'asc' },
        session.accessToken
      )
    );
  }

  return (
    <PageContainer
      fill
      pageTitle='pages.suppliers.title'
      pageDescription='pages.suppliers.description'
    >
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense fallback={<DataTableSkeleton rowCount={5} columnCount={5} />}>
          <SuppliersPageClient />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
