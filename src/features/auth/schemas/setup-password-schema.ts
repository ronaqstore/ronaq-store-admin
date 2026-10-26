import { z } from 'zod';
import type { useTranslations } from 'next-intl';

type Translator = ReturnType<typeof useTranslations>;

export const createSetupPasswordSchema = (t: Translator) =>
  z
    .object({
      password: z
        .string()
        .min(8, t('auth.setupPasswordMin'))
        .max(72, t('auth.setupPasswordMax'))
        .regex(/[A-Za-z]/, t('auth.setupPasswordLetter'))
        .regex(/\d/, t('auth.setupPasswordDigit')),
      confirmPassword: z.string().min(1, t('auth.confirmPasswordRequired'))
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.passwordMismatch'),
      path: ['confirmPassword']
    });
