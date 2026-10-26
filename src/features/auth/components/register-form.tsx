'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAppForm } from '@/lib/form';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { isValidPkMobile, normalizePhone } from '@/lib/auth/phone';
import { INPUT_LIMITS } from '@/lib/input-limits';
import { sanitizePkMobileInput } from '@/lib/validation/pk';
import { SHOP_HOME } from '@/lib/auth/routes';
import { registerOwnerAccountWithOptionalLogo } from '@/features/auth/api/service';
import { MarketplaceCityCombobox } from '@/components/marketplace/marketplace-city-combobox';
import {
  isTurnstileEnabled,
  TurnstileWidget
} from '@/components/auth/turnstile-widget';
import { shopLogoSrc } from '@/constants/placeholders';
import { prepareShopLogo } from '@/lib/prepare-image';
import type { RegisterFormValues, RegisterFormProps } from '@/types/auth';

export function RegisterForm({ title, description, footer }: RegisterFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileOn = isTurnstileEnabled();
  const handleTokenChange = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  const registerSchema = z
    .object({
      fullName: z.string().min(2, t('auth.fullNameRequired')),
      phone: z
        .string()
        .min(1, t('auth.phoneRequired'))
        .refine(isValidPkMobile, t('auth.phoneInvalid')),
      password: z.string().min(6, t('auth.passwordRequired')),
      confirmPassword: z.string().min(1, t('auth.confirmPasswordRequired')),
      shopName: z.string().min(2, t('auth.shopNameRequired')),
      city: z.string().min(1, t('auth.cityRequired')),
      address: z.string().optional()
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.passwordMismatch'),
      path: ['confirmPassword']
    });

  const form = useAppForm({
    defaultValues: {
      fullName: '',
      phone: '',
      password: '',
      confirmPassword: '',
      shopName: '',
      city: '',
      address: ''
    } as RegisterFormValues,
    validators: {
      onSubmit: registerSchema
    },
    onSubmit: async ({ value }) => {
      setError(null);
      setSuccess(null);

      if (turnstileOn && !turnstileToken) {
        setError(t('auth.turnstileRequired'));
        return;
      }

      const normalizedPhone = normalizePhone(value.phone);

      try {
        await registerOwnerAccountWithOptionalLogo(
          {
            fullName: value.fullName.trim(),
            phone: normalizedPhone,
            password: value.password,
            shopName: value.shopName.trim(),
            city: value.city.trim(),
            address: value.address?.trim() || undefined,
            turnstileToken: turnstileToken ?? undefined
          },
          logoFile
        );

        setSuccess(t('auth.registerSuccess'));

        const signInResult = await signIn('credentials', {
          phone: normalizedPhone,
          password: value.password,
          turnstileToken: turnstileToken || '',
          redirect: false
        });

        if (signInResult?.error) {
          router.push('/login');
          return;
        }

        router.replace(SHOP_HOME);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : t('auth.registerFailed');
        setError(message);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit();
  };

  const handlePickLogoClick = () => {
    logoInputRef.current?.click();
  };

  const handleClearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    try {
      const prepared = await prepareShopLogo(file);
      setLogoFile(prepared);
      setLogoPreview(URL.createObjectURL(prepared));
    } catch {
      setLogoFile(null);
      setLogoPreview(null);
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  return (
    <Card className='w-full max-w-lg border-border/60 shadow-sm'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl font-semibold tracking-tight'>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className='space-y-5' onSubmit={handleSubmit}>
          {error ? (
            <Alert variant='destructive'>
              <Icons.warning className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {success ? (
            <Alert>
              <Icons.check className='h-4 w-4 text-emerald-600' />
              <AlertDescription className='text-emerald-600 dark:text-emerald-400'>
                {success}
              </AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <form.AppField
                name='fullName'
                children={(field) => (
                  <field.TextField
                    label={t('auth.fullName')}
                    autoComplete='name'
                    placeholder={t('auth.fullNamePlaceholder')}
                    startIcon={Icons.user}
                    required
                  />
                )}
              />
              <form.AppField
                name='phone'
                children={(field) => (
                  <field.TextField
                    label={t('auth.phone')}
                    type='tel'
                    inputMode='numeric'
                    maxLength={INPUT_LIMITS.phonePk}
                    sanitize={sanitizePkMobileInput}
                    autoComplete='tel'
                    placeholder='03XXXXXXXXX'
                    startIcon={Icons.phone}
                    required
                  />
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <form.AppField
                name='password'
                children={(field) => (
                  <field.TextField
                    label={t('auth.password')}
                    type='password'
                    autoComplete='new-password'
                    placeholder='••••••••'
                    startIcon={Icons.lock}
                    required
                  />
                )}
              />
              <form.AppField
                name='confirmPassword'
                children={(field) => (
                  <field.TextField
                    label={t('auth.confirmPassword')}
                    type='password'
                    autoComplete='new-password'
                    placeholder='••••••••'
                    startIcon={Icons.lock}
                    required
                  />
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <form.AppField
                name='shopName'
                children={(field) => (
                  <field.TextField
                    label={t('auth.shopName')}
                    maxLength={INPUT_LIMITS.nameLong}
                    placeholder={t('auth.shopNamePlaceholder')}
                    startIcon={Icons.building}
                    required
                  />
                )}
              />
              <form.AppField
                name='city'
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        {t('auth.city')} *
                      </FieldLabel>
                      <MarketplaceCityCombobox
                        id={field.name}
                        value={field.state.value}
                        onChange={field.handleChange}
                        required
                      />
                      {isInvalid ? (
                        <FieldError
                          id={`${field.name}-error`}
                          errors={field.state.meta.errors}
                        />
                      ) : null}
                    </Field>
                  );
                }}
              />
            </div>

            <form.AppField
              name='address'
              children={(field) => (
                <field.TextField
                  label={t('auth.address')}
                  maxLength={INPUT_LIMITS.shopAddress}
                  placeholder={t('auth.addressPlaceholder')}
                  startIcon={Icons.building}
                />
              )}
            />

            <div className='space-y-2'>
              <Label>{t('auth.shopLogoOptional')}</Label>
              <p className='text-xs text-muted-foreground'>{t('auth.shopLogoHint')}</p>
              <div className='flex items-center gap-3'>
                <div className='relative h-16 w-16 overflow-hidden rounded-full border bg-muted'>
                  <Image
                    src={logoPreview || shopLogoSrc(null)}
                    alt=''
                    fill
                    unoptimized
                    className='object-cover'
                  />
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handlePickLogoClick}
                >
                  <Icons.upload className='me-2 h-4 w-4' />
                  {logoFile ? t('storeSettings.changeLogo') : t('storeSettings.uploadLogo')}
                </Button>
                {logoFile ? (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={handleClearLogo}
                  >
                    {t('storeSettings.removeLogo')}
                  </Button>
                ) : null}
                <input
                  ref={logoInputRef}
                  type='file'
                  accept='image/jpeg,image/png,image/webp'
                  className='hidden'
                  onChange={handleLogoFileChange}
                />
              </div>
            </div>

            {turnstileOn ? <TurnstileWidget onTokenChange={handleTokenChange} /> : null}
          </FieldGroup>

          <form.AppForm>
            <form.SubmitButton className='w-full' disabled={turnstileOn && !turnstileToken}>
              {t('auth.registerButton')}
            </form.SubmitButton>
          </form.AppForm>

          {footer}
        </form>
      </CardContent>
    </Card>
  );
}
