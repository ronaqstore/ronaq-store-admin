import { StockAdjustmentsRoute } from '@/features/inventory';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('stockAdjustments')
  };
}

export default async function Page() {
  return <StockAdjustmentsRoute />;
}
