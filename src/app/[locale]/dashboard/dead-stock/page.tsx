import PageContainer from '@/components/layout/page-container';
import { DeadStockReportPage } from '@/features/inventory';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('deadStock')
  };
}

export default async function Page() {
  return (
    <PageContainer
      fill
      pageTitle='pages.deadStock.title'
      pageDescription='pages.deadStock.description'
    >
      <Suspense fallback={<DataTableSkeleton rowCount={4} />}>
        <DeadStockReportPage />
      </Suspense>
    </PageContainer>
  );
}
