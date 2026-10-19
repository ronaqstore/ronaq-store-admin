import * as z from 'zod';
import type { useTranslations } from 'next-intl';
import { isOptionalPkMobile } from '@/lib/validation/pk';

type Translator = ReturnType<typeof useTranslations>;

export const createPartyFormSchema = (t: Translator) =>
  z.object({
    name: z.string().trim().min(1, t('validation.nameRequired')),
    phone: z
      .string()
      .trim()
      .refine(isOptionalPkMobile, t('validation.phoneInvalidPk')),
    address: z.string(),
    notes: z.string(),
    opening_balance: z
      .number({ error: t('validation.openingBalanceRequired') })
      .min(0, t('validation.valueNonNegative')),
    isActive: z.boolean().optional()
  });

export const createReceivePaymentSchema = (t: Translator) =>
  z.object({
    amount: z
      .number({ error: t('validation.amountRequired') })
      .positive(t('validation.amountPositive'))
  });
