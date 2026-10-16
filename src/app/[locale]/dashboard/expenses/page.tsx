import PageContainer from '@/components/layout/page-container';
import { ExpensesClient } from '@/features/expenses';
import { expensesQueryOptions } from '@/features/expenses';
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
    await qc.prefetchQuery(
      expensesQueryOptions(
        { page: 1, pageSize: 20, sortBy: 'expenseDate', sortOrder: 'desc' },
        token
      )
    );
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
