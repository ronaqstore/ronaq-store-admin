import PageContainer from '@/components/layout/page-container';
import { ImeiSearchPage } from '@/features/inventory';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('imeiSearch')
  };
}

export default async function Page() {
  return (
    <PageContainer
      pageTitle='pages.imeiSearch.title'
      pageDescription='pages.imeiSearch.description'
    >
      <Suspense fallback={<DataTableSkeleton rowCount={3} />}>
        <ImeiSearchPage />
      </Suspense>
    </PageContainer>
  );
}
