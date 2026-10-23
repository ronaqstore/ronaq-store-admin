import PageContainer from '@/components/layout/page-container';
import { PurchaseCreatePageClient } from '@/features/purchases/components/purchase-create-page';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('purchaseNew')
  };
}

export default async function Page() {
  return (
    <PageContainer
      pageTitle='dukaan.purchase.newTitle'
    >
      <PurchaseCreatePageClient />
    </PageContainer>
  );
}
