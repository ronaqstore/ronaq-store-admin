import PageContainer from '@/components/layout/page-container';
import { ProductFormPageClient } from '@/features/products/components/product-form-page';
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
      <ProductFormPageClient />
    </PageContainer>
  );
}
