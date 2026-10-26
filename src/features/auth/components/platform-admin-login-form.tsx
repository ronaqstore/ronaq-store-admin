'use client';

import { signIn, getSession, signOut } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { PLATFORM_HOME } from '@/lib/auth/routes';
import { normalizePhone } from '@/lib/auth/phone';
import type { LoginValues } from '@/types/auth';
import { BaseLoginForm } from './base-login-form';

export function PlatformAdminLoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const banner =
    searchParams.get('reason') === 'session' ? t('auth.sessionExpiredLogout') : null;

  const handleLogin = async (values: LoginValues): Promise<string | null> => {
    const result = await signIn('credentials', {
      phone: normalizePhone(values.phone),
      password: values.password,
      isPlatformAdmin: 'true',
      rememberMe: values.rememberMe ? 'true' : 'false',
      turnstileToken: values.turnstileToken || '',
      redirect: false
    });

    if (result?.error) {
      return t('auth.platformAdminError');
    }

    const session = await getSession();
    if (session?.user?.role !== 'SUPER_ADMIN') {
      await signOut({ redirect: false });
      return t('auth.platformAdminError');
    }

    router.replace(PLATFORM_HOME);
    router.refresh();
    return null;
  };

  return (
    <BaseLoginForm
      title={t('auth.platformAdminSignInTitle')}
      description={t('auth.platformAdminSignInDesc')}
      banner={banner}
      minPasswordLength={8}
      onSubmit={handleLogin}
      footer={
        <div className='space-y-2 text-center text-xs leading-relaxed'>
          <p className='text-muted-foreground'>{t('auth.platformAdminNotice')}</p>
          <p className='text-muted-foreground'>
            {t('auth.shopOwnerPrompt')}{' '}
            <Link
              href='/login'
              className='text-foreground underline-offset-4 hover:underline'
            >
              {t('auth.shopOwnerSignInLink')}
            </Link>
          </p>
        </div>
      }
    />
  );
}
