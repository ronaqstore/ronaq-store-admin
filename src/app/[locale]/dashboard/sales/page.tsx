import { SalesListRoute } from '@/features/sales';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('sales')
  };
}

export default async function Page() {
  return <SalesListRoute />;
}
