import PageContainer from '@/components/layout/page-container';
import { ProductCreatePageClient } from '@/features/products/components/product-create-page';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('productNew')
  };
}

export default async function NewProductPage() {
  return (
    <PageContainer pageTitle='dukaan.product.addTitle'>
      <ProductCreatePageClient />
    </PageContainer>
  );
}
