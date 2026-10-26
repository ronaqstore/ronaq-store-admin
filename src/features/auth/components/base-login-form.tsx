'use client';

import { useCallback, useState } from 'react';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useAppForm } from '@/lib/form';
import { FieldGroup } from '@/components/ui/field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import { isValidPkMobile } from '@/lib/auth/phone';
import { INPUT_LIMITS } from '@/lib/input-limits';
import {
  isTurnstileEnabled,
  TurnstileWidget
} from '@/components/auth/turnstile-widget';
import type { BaseLoginFormProps, LoginValues } from '@/types/auth';

export function BaseLoginForm({
  title,
  description,
  banner,
  minPasswordLength = 1,
  onSubmit,
  footer
}: BaseLoginFormProps) {
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileOn = isTurnstileEnabled();

  const handleTokenChange = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  const loginSchema = z.object({
    phone: z
      .string()
      .min(1, t('auth.phoneRequired'))
      .refine(isValidPkMobile, t('auth.phoneInvalid')),
    password: z.string().min(minPasswordLength, t('auth.passwordRequired')),
    rememberMe: z.boolean()
  });

  const form = useAppForm({
    defaultValues: {
      phone: '',
      password: '',
      rememberMe: false
    } as LoginValues,
    validators: {
      onSubmit: loginSchema
    },
    onSubmit: async ({ value }) => {
      setError(null);
      if (turnstileOn && !turnstileToken) {
        setError(t('auth.turnstileRequired'));
        return;
      }
      const errorMessage = await onSubmit({
        ...value,
        turnstileToken: turnstileToken ?? ''
      });
      if (errorMessage) {
        setError(errorMessage);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit();
  };

  return (
    <Card className='w-full max-w-md border-border/60 shadow-sm'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl font-semibold tracking-tight'>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className='space-y-6' onSubmit={handleSubmit}>
          {banner ? (
            <Alert variant='destructive'>
              <Icons.warning className='h-4 w-4' />
              <AlertDescription>{banner}</AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert variant='destructive'>
              <Icons.warning className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <form.AppField
              name='phone'
              children={(field) => (
                <field.TextField
                  label={t('auth.phone')}
                  type='tel'
                  inputMode='numeric'
                  maxLength={INPUT_LIMITS.phone}
                  autoComplete='tel'
                  placeholder='03XXXXXXXXX'
                  startIcon={Icons.phone}
                  required
                />
              )}
            />
            <form.AppField
              name='password'
              children={(field) => (
                <field.TextField
                  label={t('auth.password')}
                  type='password'
                  autoComplete='current-password'
                  placeholder='••••••••'
                  startIcon={Icons.lock}
                  required
                />
              )}
            />
            <form.AppField
              name='rememberMe'
              children={(field) => <field.CheckboxField label={t('auth.rememberMe')} />}
            />
            {turnstileOn ? <TurnstileWidget onTokenChange={handleTokenChange} /> : null}
          </FieldGroup>

          <form.AppForm>
            <form.SubmitButton className='w-full' disabled={turnstileOn && !turnstileToken}>
              <Icons.login className='size-4' />
              {t('auth.signIn')}
            </form.SubmitButton>
          </form.AppForm>

          {footer}
        </form>
      </CardContent>
    </Card>
  );
}
