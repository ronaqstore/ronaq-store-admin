'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { IconBrandWhatsapp, IconClock, IconAlertTriangle } from '@tabler/icons-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { buttonVariants } from '@/components/ui/button';
import {
  calculateSubscriptionDaysRemaining,
  formatSubscriptionExpiryDate,
  buildWhatsAppSupportUrl
} from '@/lib/subscription';
import { cn } from '@/lib/utils';

export function SubscriptionBadge() {
  const { data: session } = useSession();
  const t = useTranslations('subscription');
  const locale = useLocale();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Strict role check: ONLY OWNER accounts, NEVER platform admins (SUPER_ADMIN)
  if (!session?.user || session.user.role !== 'OWNER') {
    return null;
  }

  // Hydration safety: render placeholder or nothing until mounted on client
  if (!mounted) {
    return null;
  }

  const endsAt = session.user.subscriptionEndsAt;
  const daysLeft = calculateSubscriptionDaysRemaining(endsAt);
  const isPaid = session.user.subscriptionStatus === 'ACTIVE';
  const shopName = session.user.shopName ?? '';
  const supportUrl = buildWhatsAppSupportUrl({ shopName });

  if (daysLeft === null) {
    return null;
  }

  // Determine appearance variant based on days remaining
  let colorStyles = '';
  let dotStyles = '';
  let fullText = '';
  let compactText = '';
  let isAlert = false;

  if (isPaid) {
    if (daysLeft > 7) {
      colorStyles =
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15';
      dotStyles = 'bg-emerald-500';
      fullText = t('planActive');
      compactText = fullText;
    } else if (daysLeft >= 1) {
      colorStyles =
        'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/15';
      dotStyles = 'bg-amber-500';
      fullText = t('planDaysLeft', { count: daysLeft });
      compactText = `${daysLeft}d`;
      isAlert = true;
    } else if (daysLeft === 0) {
      colorStyles =
        'bg-amber-600/15 text-amber-800 dark:text-amber-200 border-amber-500/40 hover:bg-amber-600/20';
      dotStyles = 'bg-amber-600';
      fullText = t('planEndsToday');
      compactText = '0d';
      isAlert = true;
    } else {
      colorStyles =
        'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/15';
      dotStyles = 'bg-rose-500';
      fullText = t('planExpired');
      compactText = 'Exp';
      isAlert = true;
    }
  } else {
    // Free Trial lifecycle
    if (daysLeft > 7) {
      colorStyles =
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15';
      dotStyles = 'bg-emerald-500';
      fullText = t('trialDaysLeft', { count: daysLeft });
      compactText = `${daysLeft}d`;
    } else if (daysLeft >= 1) {
      colorStyles =
        'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/15';
      dotStyles = 'bg-amber-500';
      fullText = t('trialDaysLeft', { count: daysLeft });
      compactText = `${daysLeft}d`;
      isAlert = true;
    } else if (daysLeft === 0) {
      colorStyles =
        'bg-amber-600/15 text-amber-800 dark:text-amber-200 border-amber-500/40 hover:bg-amber-600/20';
      dotStyles = 'bg-amber-600';
      fullText = t('trialEndsToday');
      compactText = '0d';
      isAlert = true;
    } else {
      colorStyles =
        'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/15';
      dotStyles = 'bg-rose-500';
      fullText = t('trialExpired');
      compactText = 'Exp';
      isAlert = true;
    }
  }

  const formattedDate = formatSubscriptionExpiryDate(endsAt, locale);
  const currentPlanLabel = isPaid ? t('activePlan') : t('freeTrial');

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type='button'
            className={cn(
              'group/sub-badge inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
              colorStyles
            )}
            aria-label={`${fullText} - ${t('status')}`}
          />
        }
      >
        {isAlert ? (
          <IconAlertTriangle className='size-3.5 shrink-0 text-amber-600 dark:text-amber-400' />
        ) : (
          <span className={cn('size-2 shrink-0 rounded-full', dotStyles)} aria-hidden='true' />
        )}
        <span className='hidden sm:inline'>{fullText}</span>
        <span className='inline sm:hidden font-semibold'>{compactText}</span>
      </PopoverTrigger>

      <PopoverContent align='end' sideOffset={8} className='w-80 p-4'>
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between border-b border-border/60 pb-2.5'>
            <div className='flex items-center gap-2'>
              <span className={cn('size-2.5 rounded-full', dotStyles)} aria-hidden='true' />
              <span className='text-sm font-semibold tracking-tight'>{currentPlanLabel}</span>
            </div>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                colorStyles
              )}
            >
              {fullText}
            </span>
          </div>

          <div className='flex flex-col gap-1.5 text-xs text-muted-foreground'>
            <div className='flex items-center justify-between'>
              <span>{t('exactExpiry')}</span>
              <span className='font-medium text-foreground flex items-center gap-1'>
                <IconClock className='size-3.5 text-muted-foreground' />
                {formattedDate}
              </span>
            </div>
            {shopName ? (
              <div className='flex items-center justify-between'>
                <span>{shopName}</span>
              </div>
            ) : null}
          </div>

          <a
            href={supportUrl}
            target='_blank'
            rel='noopener noreferrer'
            className={cn(
              buttonVariants({ size: 'sm' }),
              'w-full mt-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs flex items-center justify-center gap-2'
            )}
          >
            <IconBrandWhatsapp className='size-4' />
            <span>{t('contactSupport')}</span>
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
