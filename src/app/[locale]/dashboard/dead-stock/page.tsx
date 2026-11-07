import PageContainer from '@/components/layout/page-container';
import { DeadStockReportPage } from '@/features/inventory';
import { auth } from '@/auth';
import { localize } from '@/lib/auth/routes';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('deadStock')
  };
}

export default async function Page() {
  const session = await auth();
  if (session?.user?.role === 'SALESMAN') {
    const locale = await getLocale();
    redirect(localize('/dashboard/sales', locale));
  }

  return (
    <PageContainer pageTitle='pages.deadStock.title' pageDescription='pages.deadStock.description'>
      <Suspense fallback={<DataTableSkeleton rowCount={4} />}>
        <DeadStockReportPage />
      </Suspense>
    </PageContainer>
  );
}
