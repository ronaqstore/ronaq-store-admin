import PageContainer from '@/components/layout/page-container';
import { ChangePasswordForm } from '@/features/account/components/change-password-form';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('account')
  };
}

export default function AccountSettingsPage() {
  return (
    <PageContainer
      pageTitle='pages.account.title'
      pageDescription='pages.account.description'
    >
      <ChangePasswordForm />
    </PageContainer>
  );
}
