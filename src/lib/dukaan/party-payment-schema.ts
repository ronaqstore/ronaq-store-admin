import * as z from 'zod';
import type { useTranslations } from 'next-intl';

type Translator = ReturnType<typeof useTranslations>;

export const createReceivePaymentSchema = (t: Translator) =>
  z.object({
    amount: z
      .number({ error: t('validation.amountRequired') })
      .positive(t('validation.amountPositive'))
  });
