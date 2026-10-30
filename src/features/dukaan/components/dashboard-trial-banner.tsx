'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { IconAlertTriangle, IconBrandWhatsapp } from '@tabler/icons-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { calculateSubscriptionDaysRemaining, buildWhatsAppSupportUrl } from '@/lib/subscription';

export function DashboardTrialBanner() {
  const { data: session } = useSession();
  const t = useTranslations('subscription');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !session?.user || session.user.role !== 'OWNER') {
    return null;
  }

  const isPaid = session.user.subscriptionStatus === 'ACTIVE';
  const daysLeft = calculateSubscriptionDaysRemaining(session.user.subscriptionEndsAt);
  if (daysLeft === null || daysLeft > 7) {
    return null;
  }

  const shopName = session.user.shopName ?? '';
  const supportUrl = buildWhatsAppSupportUrl({
    shopName,
    message: isPaid
      ? `Assalam-o-Alaikum, my subscription for "${shopName}" ends in ${Math.max(0, daysLeft)} days. I want to renew.`
      : `Assalam-o-Alaikum, my trial for "${shopName}" ends in ${Math.max(0, daysLeft)} days. I want to renew my subscription.`
  });

  const title = isPaid
    ? daysLeft === 0
      ? t('bannerPlanEndingToday')
      : daysLeft < 0
        ? t('planExpired')
        : t('bannerPlanWarning', { count: daysLeft })
    : daysLeft === 0
      ? t('bannerTrialEndingToday')
      : daysLeft < 0
        ? t('trialExpired')
        : t('bannerTrialWarning', { count: daysLeft });

  return (
    <div
      role='alert'
      className='relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 shadow-xs'
    >
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3.5'>
          <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300'>
            <IconAlertTriangle className='size-5' />
          </div>
          <div className='space-y-1'>
            <h2 className='text-sm sm:text-base font-semibold text-foreground tracking-tight'>
              {title}
            </h2>
            <p className='text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed'>
              {t('bannerDescription')}
            </p>
          </div>
        </div>

        <div className='flex shrink-0 items-center ps-12 sm:ps-0'>
          <a
            href={supportUrl}
            target='_blank'
            rel='noopener noreferrer'
            className={cn(
              buttonVariants({ size: 'sm' }),
              'bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs text-xs sm:text-sm h-9 px-4 flex items-center gap-2'
            )}
          >
            <IconBrandWhatsapp className='size-4' />
            <span>{t('contactSupportToActivate')}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
