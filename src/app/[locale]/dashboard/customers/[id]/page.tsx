import PageContainer from '@/components/layout/page-container';
import { CustomerLedgerClient } from '@/features/customers';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import type { IdPageProps } from '@/types';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('customerLedger')
  };
}

export default async function Page({ params }: IdPageProps) {
  const { id } = await params;

  return (
    <PageContainer
      pageTitle='pages.customerLedger.title'
      pageDescription='pages.customerLedger.description'
    >
      <Suspense>
        <CustomerLedgerClient id={id} />
      </Suspense>
    </PageContainer>
  );
}
