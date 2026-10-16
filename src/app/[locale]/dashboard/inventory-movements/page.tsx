import { InventoryMovementsRoute } from '@/features/inventory';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('inventoryMovements')
  };
}

export default async function Page() {
  return <InventoryMovementsRoute />;
}
