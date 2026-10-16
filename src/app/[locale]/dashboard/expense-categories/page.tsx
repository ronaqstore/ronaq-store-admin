import PageContainer from '@/components/layout/page-container';
import { ExpenseCategoriesClient } from '@/features/expenses';
import { expenseCategoriesQueryOptions } from '@/features/expenses';
import { getQueryClient } from '@/lib/query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('expenseCategories')
  };
}

export default async function Page() {
  const session = await auth();
  const token = session?.accessToken;
  const qc = getQueryClient();

  if (token) {
    await qc.prefetchQuery(
      expenseCategoriesQueryOptions(
        { page: 1, pageSize: 20, sortBy: 'name', sortOrder: 'asc' },
        token
      )
    );
  }

  return (
    <PageContainer
      fill
      pageTitle='pages.expenseCategories.title'
      pageDescription='pages.expenseCategories.description'
    >
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense fallback={<DataTableSkeleton rowCount={5} columnCount={4} />}>
          <ExpenseCategoriesClient />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
