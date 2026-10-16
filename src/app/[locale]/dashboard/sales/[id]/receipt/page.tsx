import { SaleReceiptClient, SalePrefetchRoute } from '@/features/sales';
import { getTranslations } from 'next-intl/server';
import type { IdPageProps } from '@/types';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('saleReceipt')
  };
}

export default async function Page({ params }: IdPageProps) {
  const { id } = await params;

  return (
    <div className='p-6'>
      <SalePrefetchRoute id={id}>
        <SaleReceiptClient id={id} />
      </SalePrefetchRoute>
    </div>
  );
}