'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { FieldGroup } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { useAppForm } from '@/lib/form';
import { setupPasswordWithToken } from '@/features/auth/api/service';
import { createSetupPasswordSchema } from '@/features/auth/schemas/setup-password-schema';

export function SetupPasswordForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => (searchParams.get('token') ?? '').trim(), [searchParams]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const form = useAppForm({
    defaultValues: {
      password: '',
      confirmPassword: ''
    },
    validators: {
      onSubmit: createSetupPasswordSchema(t)
    },
    onSubmit: async ({ value }) => {
      if (!token) {
        setError(t('auth.setupPasswordInvalidLink'));
        return;
      }
      setSaving(true);
      setError(null);
      try {
        await setupPasswordWithToken(token, value.password);
        setDone(true);
        window.setTimeout(() => {
          router.replace('/login');
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('auth.setupPasswordFailed'));
      } finally {
        setSaving(false);
      }
    }
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  if (!token) {
    return (
      <div className='bg-card space-y-4 rounded-xl border border-border p-6 shadow-sm'>
        <h2 className='text-lg font-semibold'>{t('auth.setupPasswordInvalidTitle')}</h2>
        <p className='text-muted-foreground text-sm'>{t('auth.setupPasswordInvalidLink')}</p>
        <Button type='button' className='w-full' onClick={() => router.replace('/login')}>
          {t('auth.signIn')}
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className='bg-card space-y-4 rounded-xl border border-border p-6 shadow-sm text-center'>
        <h2 className='text-lg font-semibold'>{t('auth.setupPasswordSuccessTitle')}</h2>
        <p className='text-muted-foreground text-sm'>{t('auth.setupPasswordSuccessBody')}</p>
        <Link href='/login' className='text-primary text-sm font-medium underline-offset-4 hover:underline'>
          {t('auth.signIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className='bg-card space-y-4 rounded-xl border border-border p-6 shadow-sm'>
      <div>
        <h2 className='text-lg font-semibold'>{t('auth.setupPasswordTitle')}</h2>
        <p className='text-muted-foreground mt-1 text-sm'>{t('auth.setupPasswordHint')}</p>
      </div>

      <form className='space-y-4' onSubmit={handleSubmit}>
        <FieldGroup>
          <form.AppField name='password'>
            {(field) => (
              <field.TextField
                label={t('auth.newPassword')}
                type='password'
                autoComplete='new-password'
                required
                description={t('auth.setupPasswordRules')}
              />
            )}
          </form.AppField>
          <form.AppField name='confirmPassword'>
            {(field) => (
              <field.TextField
                label={t('auth.confirmPassword')}
                type='password'
                autoComplete='new-password'
                required
              />
            )}
          </form.AppField>
        </FieldGroup>

        {error ? <p className='text-destructive text-sm'>{error}</p> : null}

        <Button type='submit' className='w-full' loading={saving} disabled={saving}>
          {t('auth.setupPasswordSubmit')}
        </Button>
      </form>
    </div>
  );
}
