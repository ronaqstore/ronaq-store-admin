import PageContainer from '@/components/layout/page-container';
import { SettingsPageSkeleton } from '@/components/settings/settings-page-skeleton';

export default function SettingsLoading() {
  return (
    <PageContainer
      pageTitle='pages.settings.title'
      pageDescription='pages.settings.description'
    >
      <SettingsPageSkeleton />
    </PageContainer>
  );
}
