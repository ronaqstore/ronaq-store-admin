import { ShopSettingsPrefetchRoute } from '@/components/settings/shop-settings-route';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('settings')
  };
}

export default function StoreSettingsPage() {
  return <ShopSettingsPrefetchRoute />;
}
