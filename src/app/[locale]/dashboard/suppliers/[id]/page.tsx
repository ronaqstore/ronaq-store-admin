import PageContainer from '@/components/layout/page-container';
import { SupplierLedgerClient, SupplierLedgerPrefetchRoute } from '@/features/suppliers';
import { auth } from '@/auth';
import { localize } from '@/lib/auth/routes';
import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import type { IdPageProps } from '@/types';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('supplierLedger')
  };
}

export default async function Page({ params }: IdPageProps) {
  const session = await auth();
  if (session?.user?.role === 'SALESMAN') {
    const locale = await getLocale();
    redirect(localize('/dashboard/sales', locale));
  }
  const { id } = await params;

  return (
    <PageContainer
      pageTitle='pages.supplierLedger.title'
      pageDescription='pages.supplierLedger.description'
    >
      <SupplierLedgerPrefetchRoute id={id}>
        <SupplierLedgerClient id={id} />
      </SupplierLedgerPrefetchRoute>
    </PageContainer>
  );
}
