import PageContainer from '@/components/layout/page-container';
import NotificationsPage, {
  NotificationsHeaderAction
} from '@/features/notifications/components/notifications-page';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('notifications')
  };
}

export default function Page() {
  return (
    <PageContainer
      pageTitle='pages.notifications.title'
      pageDescription='pages.notifications.description'
      pageHeaderAction={<NotificationsHeaderAction />}
    >
      <NotificationsPage />
    </PageContainer>
  );
}
