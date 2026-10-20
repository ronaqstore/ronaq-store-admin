import PageContainer from '@/components/layout/page-container';
import { ProductFormPageClient } from '@/features/products/components/product-form-page';
import type { EditProductPageProps } from '@/types/products';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('productEdit')
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  return (
    <PageContainer pageTitle='dukaan.product.editTitle'>
      <ProductFormPageClient productId={id} />
    </PageContainer>
  );
}
