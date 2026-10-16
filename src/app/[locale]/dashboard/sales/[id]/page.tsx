import PageContainer from '@/components/layout/page-container';
import { SaleDetailClient, SalePrefetchRoute } from '@/features/sales';
import { getTranslations } from 'next-intl/server';
import type { IdPageProps } from '@/types';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('saleDetail')
  };
}

export default async function Page({ params }: IdPageProps) {
  const { id } = await params;

  return (
    <PageContainer
      pageTitle='pages.saleDetail.title'
      pageDescription='pages.saleDetail.description'
    >
      <SalePrefetchRoute id={id}>
        <SaleDetailClient id={id} />
      </SalePrefetchRoute>
    </PageContainer>
  );
}
