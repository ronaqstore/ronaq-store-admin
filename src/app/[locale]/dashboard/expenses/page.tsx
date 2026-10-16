import PageContainer from '@/components/layout/page-container';
import { ExpensesClient } from '@/features/expenses';
import { expenseCategoriesQueryOptions, expensesQueryOptions } from '@/features/expenses';
import { getQueryClient } from '@/lib/query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('expenses')
  };
}

export default async function Page() {
  const session = await auth();
  const token = session?.accessToken;
  const qc = getQueryClient();

  if (token) {
    await Promise.all([
      qc.prefetchQuery(expensesQueryOptions({ pageSize: 20 }, token)),
      qc.prefetchQuery(expenseCategoriesQueryOptions({ pageSize: 50, isActive: true }, token))
    ]);
  }

  return (
    <PageContainer
      fill
      pageTitle='pages.expenses.title'
      pageDescription='pages.expenses.description'
    >
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense>
          <ExpensesClient />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
