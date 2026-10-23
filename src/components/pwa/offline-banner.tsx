'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function OfflineBanner() {
  const t = useTranslations();
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role='status'
      aria-live='polite'
      className={cn(
        buttonVariants({ variant: 'default' }),
        'h-auto w-full rounded-none border-0 px-4 py-1.5 text-center text-xs font-medium shadow-none hover:bg-primary'
      )}
    >
      {t('pwa.offlineBanner')}
    </div>
  );
}
