'use client';

import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { NotificationCard } from '@/components/ui/notification-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from '@/i18n/navigation';
import { useNotificationStore } from '../utils/store';

const actionRoutes: Record<string, string> = {
  view: '/dashboard/overview',
  'view-product': '/dashboard/product',
  billing: '/dashboard/overview',
  open: '/dashboard/kanban',
  'open-chat': '/dashboard/chat'
};

export function NotificationsHeaderAction() {
  const { markAllAsRead, unreadCount } = useNotificationStore();
  const t = useTranslations();
  const count = unreadCount();

  if (count <= 0) return null;

  return (
    <Button type='button' variant='outline' size='sm' onClick={markAllAsRead}>
      {t('notifications.markAllAsRead')}
    </Button>
  );
}

export default function NotificationsPage() {
  const { notifications, markAsRead } = useNotificationStore();
  const router = useRouter();
  const t = useTranslations();

  const unreadNotifications = notifications.filter((n) => n.status === 'unread');
  const readNotifications = notifications.filter((n) => n.status === 'read');

  const handleAction = (notifId: string, actionId: string) => {
    const route = actionRoutes[actionId];
    if (route) {
      markAsRead(notifId);
      router.push(route);
    }
  };

  const renderList = (items: typeof notifications) => {
    if (items.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-16'>
          <Icons.notification className='text-muted-foreground/40 mb-3 h-10 w-10' />
          <p className='text-muted-foreground text-sm'>{t('notifications.noNotifications')}</p>
        </div>
      );
    }

    return (
      <div className='flex flex-col gap-2'>
        {items.map((notification) => (
          <NotificationCard
            key={notification.id}
            id={notification.id}
            title={notification.title}
            body={notification.body}
            status={notification.status}
            createdAt={notification.createdAt}
            actions={notification.actions}
            onMarkAsRead={markAsRead}
            onAction={handleAction}
          />
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue='all'>
      <TabsList>
        <TabsTrigger value='all'>
          {t('notifications.tabAll')} ({notifications.length})
        </TabsTrigger>
        <TabsTrigger value='unread'>
          {t('notifications.tabUnread')} ({unreadNotifications.length})
        </TabsTrigger>
        <TabsTrigger value='read'>
          {t('notifications.tabRead')} ({readNotifications.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value='all' className='mt-4'>
        {renderList(notifications)}
      </TabsContent>
      <TabsContent value='unread' className='mt-4'>
        {renderList(unreadNotifications)}
      </TabsContent>
      <TabsContent value='read' className='mt-4'>
        {renderList(readNotifications)}
      </TabsContent>
    </Tabs>
  );
}
