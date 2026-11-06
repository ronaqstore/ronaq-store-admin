import PageContainer from '@/components/layout/page-container';
import { SuppliersPageClient, suppliersQueryOptions } from '@/features/suppliers';
import { getQueryClient } from '@/lib/query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { getTranslations, getLocale } from 'next-intl/server';
import { auth } from '@/auth';
import { localize } from '@/lib/auth/routes';
import { redirect } from 'next/navigation';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('suppliers')
  };
}

export default async function Page() {
  const session = await auth();
  if (session?.user?.role === 'SALESMAN') {
    const locale = await getLocale();
    redirect(localize('/dashboard/sales', locale));
  }
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
