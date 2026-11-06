import PageContainer from '@/components/layout/page-container';
import { StaffPage } from '@/features/staff';
import { auth } from '@/auth';
import { homePathForRole } from '@/lib/auth/routes';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('staff')
  };
}

export default async function Page() {
  const session = await auth();
  if (session?.user?.role !== 'OWNER') {
    const locale = await getLocale();
    redirect(homePathForRole(session?.user?.role, locale));
  }

  return (
    <PageContainer fill pageTitle='pages.staff.title' pageDescription='pages.staff.description'>
      <Suspense fallback={<DataTableSkeleton rowCount={4} columnCount={5} />}>
        <StaffPage />
      </Suspense>
    </PageContainer>
  );
}
