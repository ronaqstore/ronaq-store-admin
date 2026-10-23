import * as z from 'zod';
import type { useTranslations } from 'next-intl';
import { isOptionalPkCnic, isOptionalPkMobile } from '@/lib/validation/pk';

type Translator = ReturnType<typeof useTranslations>;

export const createSupplierFormSchema = (t: Translator) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, t('validation.nameRequired'))
      .max(150, t('validation.nameTooLong')),
    phone: z
      .string()
      .trim()
      .refine(isOptionalPkMobile, t('validation.phoneInvalidPk')),
    cnic: z
      .string()
      .trim()
      .refine(isOptionalPkCnic, t('validation.cnicInvalid')),
    address: z.string().trim().max(300),
    notes: z.string().trim().max(1000),
    opening_balance: z.union([
      z.number().min(0, t('validation.valueNonNegative')),
      z.literal('')
    ])
  });
