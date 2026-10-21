import PageContainer from '@/components/layout/page-container';
import { SupplierLedgerClient, SupplierLedgerPrefetchRoute } from '@/features/suppliers';
import { getTranslations } from 'next-intl/server';
import type { IdPageProps } from '@/types';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('supplierLedger')
  };
}

export default async function Page({ params }: IdPageProps) {
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
