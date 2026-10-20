import PageContainer from '@/components/layout/page-container';
import {
  CashLedgerClient,
  cashOpeningStatusQueryOptions,
  cashQueryOptions
} from '@/features/cash';
import { getQueryClient } from '@/lib/query-client';
import { auth } from '@/auth';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('cashLedger')
  };
}

export default async function Page() {
  const session = await auth();
  const token = session?.accessToken;
  const qc = getQueryClient();
  if (token) {
    await Promise.all([
      qc.prefetchQuery(
        cashQueryOptions(
          { page: 1, pageSize: 20, sortBy: 'movementDate', sortOrder: 'desc' },
          token
        )
      ),
      qc.prefetchQuery(cashOpeningStatusQueryOptions(token))
    ]);
  }
  return (
    <PageContainer fill pageTitle='pages.cash.title' pageDescription='pages.cash.description'>
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense fallback={<DataTableSkeleton rowCount={5} columnCount={5} />}>
          <CashLedgerClient />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
