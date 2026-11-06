import PageContainer from '@/components/layout/page-container';
import { StaffPage } from '@/features/staff';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('staff')
  };
}

export default async function Page() {
  return (
    <PageContainer fill pageTitle='pages.staff.title' pageDescription='pages.staff.description'>
      <Suspense fallback={<DataTableSkeleton rowCount={4} />}>
        <StaffPage />
      </Suspense>
    </PageContainer>
  );
}
