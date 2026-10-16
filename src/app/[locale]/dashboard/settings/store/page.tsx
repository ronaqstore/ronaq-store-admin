import PageContainer from '@/components/layout/page-container';
import { StoreSettingsForm } from '@/features/store-settings/components/store-settings-form';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('storeSettings')
  };
}

export default function StoreSettingsPage() {
  return (
    <PageContainer>
      <StoreSettingsForm />
    </PageContainer>
  );
}
