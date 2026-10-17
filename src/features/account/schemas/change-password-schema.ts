import { z } from 'zod';
import type { useTranslations } from 'next-intl';

type Translator = ReturnType<typeof useTranslations>;

export const createChangePasswordSchema = (t: Translator) =>
  z
    .object({
      currentPassword: z.string().min(1, t('account.currentPasswordRequired')),
      newPassword: z
        .string()
        .min(8, t('account.newPasswordMin'))
        .max(72, t('account.newPasswordMax'))
        .regex(/[A-Za-z]/, t('account.newPasswordLetter'))
        .regex(/\d/, t('account.newPasswordDigit')),
      confirmPassword: z.string().min(1, t('account.confirmPasswordRequired'))
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('account.passwordMismatch'),
      path: ['confirmPassword']
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: t('account.passwordMustDiffer'),
      path: ['newPassword']
    });
