'use client';

import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { IconBrandWhatsapp, IconShieldCheck, IconPhone, IconArrowLeft } from '@tabler/icons-react';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { buildWhatsAppSupportUrl, getSupportWhatsAppNumber } from '@/lib/subscription';

export function SubscriptionExpiredCard() {
  const t = useTranslations('subscription');
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const queryShop = searchParams.get('shop');
  const sessionShop = session?.user?.shopName;
  const shopName = queryShop || sessionShop || '';

  const supportNumber = getSupportWhatsAppNumber();
  const whatsappUrl = buildWhatsAppSupportUrl({
    shopName,
    message: shopName
      ? `Assalam-o-Alaikum, my trial period for "${shopName}" has concluded. I would like to renew our Ronaq Store subscription.`
      : 'Assalam-o-Alaikum, my trial period has concluded. I would like to renew our Ronaq Store subscription.'
  });

  const description = shopName
    ? t('expiredDescription', { shopName })
    : t('expiredDescriptionGeneral');

  return (
    <div className='relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl backdrop-blur-sm'>
      <div
        aria-hidden
        className='pointer-events-none absolute -top-24 -inset-e-24 size-48 rounded-full bg-amber-500/10 blur-3xl'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute -bottom-24 -inset-s-24 size-48 rounded-full bg-emerald-500/10 blur-3xl'
      />

      <div className='relative z-10 flex flex-col items-center text-center'>
        <div className='mb-5 flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-8 ring-amber-500/5'>
          <IconShieldCheck className='size-9' />
        </div>

        <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
          {t('expiredTitle')}
        </h1>

        <div className='my-5 w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-start'>
          <div className='flex items-start gap-3'>
            <div className='mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'>
              <IconShieldCheck className='size-4' />
            </div>
            <p className='text-xs sm:text-sm leading-relaxed text-foreground/90 font-medium'>
              {description}
            </p>
          </div>
        </div>

        <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mb-6'>
          {t('renewPrompt')}
        </p>

        <div className='flex w-full flex-col gap-3'>
          <a
            href={whatsappUrl}
            target='_blank'
            rel='noopener noreferrer'
            className={cn(
              buttonVariants({ size: 'lg' }),
              'w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-2'
            )}
          >
            <IconBrandWhatsapp className='size-5' />
            <span>{t('renewNow')}</span>
          </a>

          <div className='flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1'>
            <a
              href={`tel:+${supportNumber}`}
              className='inline-flex items-center gap-1.5 hover:text-foreground transition-colors'
            >
              <IconPhone className='size-3.5' />
              <span>
                {t('callSupport')}: +{supportNumber}
              </span>
            </a>
          </div>
        </div>

        <div className='mt-8 pt-4 border-t border-border/60 w-full'>
          <Link
            href='/login'
            className='inline-flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors'
          >
            <IconArrowLeft className='size-3.5 rtl:rotate-180' />
            <span>{t('backToLogin')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
