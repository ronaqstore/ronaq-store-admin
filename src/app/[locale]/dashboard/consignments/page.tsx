import { ConsignmentsListRoute } from '@/features/consignments';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('consignments')
  };
}

export default async function Page() {
  return <ConsignmentsListRoute />;
}
