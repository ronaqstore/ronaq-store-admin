import { Suspense } from 'react';
import { RegisterForm } from '@/features/auth/components/register-form';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return {
    title: t('registerTitle'),
    description: t('registerHint')
  };
}

export default async function RegisterPage() {
  const t = await getTranslations('auth');
  const tm = await getTranslations('metadata');

  return (
    <div className='bg-background relative flex h-svh max-h-svh w-full flex-col items-center justify-start overflow-y-auto overscroll-contain px-4 py-8 sm:justify-center sm:px-6 sm:py-12 no-scrollbar'>
      <div
        aria-hidden
        className='pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.7_0.05_250_/_0.12),transparent_55%)]'
      />
      <div className='relative z-10 mb-6 text-center shrink-0'>
        <p className='text-muted-foreground text-sm font-medium tracking-wide uppercase'>
          {tm('dukaanPro')}
        </p>
        <h1 className='mt-1 text-3xl font-semibold tracking-tight'>{t('registerTitle')}</h1>
      </div>
      <div className='relative z-10 w-full max-w-lg shrink-0 pb-12 sm:pb-8'>
        <Suspense fallback={<div className='bg-muted h-96 animate-pulse rounded-xl' />}>
          <RegisterForm
            title={t('register')}
            description={t('registerHint')}
            footer={
              <div className='space-y-2 text-center text-xs leading-relaxed'>
                <p className='text-muted-foreground'>
                  {t('haveAccountPrompt')}{' '}
                  <Link
                    href='/login'
                    className='text-primary font-medium underline-offset-4 hover:underline'
                  >
                    {t('signInLink')}
                  </Link>
                </p>
                <p className='text-muted-foreground'>
                  {t('platformAdminPrompt')}{' '}
                  <Link
                    href='/platform-admin/login'
                    className='text-foreground underline-offset-4 hover:underline'
                  >
                    {t('platformAdminSignInLink')}
                  </Link>
                </p>
              </div>
            }
          />
        </Suspense>
      </div>
    </div>
  );
}
