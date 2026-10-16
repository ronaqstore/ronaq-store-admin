import { PurchasesListRoute } from '@/features/purchases';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('purchases')
  };
}

export default async function Page() {
  return <PurchasesListRoute />;
}
