'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import { cn } from '@/lib/utils';
import type { ShopVisibilityAlertsProps } from '@/types/dukaan';

function daysRemaining(iso: string, nowMs: number): number {
  const end = new Date(iso).getTime();
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, Math.ceil((end - nowMs) / 86_400_000));
}

function formatEndDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function ShopVisibilityAlerts({
  publishedProductTotal,
  subscriptionEndsAt
}: ShopVisibilityAlertsProps) {
  const t = useT();
  const locale = useLocale();
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
  }, [subscriptionEndsAt]);

  const needsProduct = publishedProductTotal < 1;
  const endMs = subscriptionEndsAt ? new Date(subscriptionEndsAt).getTime() : NaN;
  const trialDays =
    nowMs != null && Number.isFinite(endMs) && endMs > nowMs
      ? daysRemaining(subscriptionEndsAt as string, nowMs)
      : null;
  const showTrial = trialDays != null && trialDays > 0;

  if (!needsProduct && !showTrial) return null;

  const endsLabel =
    showTrial && subscriptionEndsAt ? formatEndDate(subscriptionEndsAt, locale) : '';
  const themeAlertClass =
    'border-primary/25 bg-primary/8 text-foreground shadow-xs *:[svg]:text-primary';

  return (
    <div className='flex flex-col gap-3'>
      {needsProduct ? (
        <Alert className={cn(themeAlertClass)}>
          <Icons.building className='size-4' />
          <AlertTitle>{t('dashboard.alerts.visibilityTitle')}</AlertTitle>
          <AlertDescription>{t('dashboard.alerts.visibilityBody')}</AlertDescription>
          <AlertAction>
            <Link
              href='/dashboard/products/new'
              className={cn(buttonVariants({ size: 'sm' }), 'h-8')}
            >
              {t('dashboard.alerts.visibilityCta')}
            </Link>
          </AlertAction>
        </Alert>
      ) : null}

      {showTrial ? (
        <Alert className={cn(themeAlertClass)}>
          <Icons.sparkles className='size-4' />
          <AlertTitle>{t('dashboard.alerts.trialTitle')}</AlertTitle>
          <AlertDescription>
            {t('dashboard.alerts.trialBody', {
              days: trialDays,
              date: endsLabel
            })}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
