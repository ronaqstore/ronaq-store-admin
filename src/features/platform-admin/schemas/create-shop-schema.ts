import { z } from 'zod';
import type { useTranslations } from 'next-intl';

type Translator = ReturnType<typeof useTranslations>;

export const createShopFormSchema = (t: Translator) =>
  z.object({
    shopName: z
      .string()
      .trim()
      .min(2, t('platform.validation.shopNameMin'))
      .max(150, t('platform.validation.shopNameMax')),
    shopPhone: z.string().trim().max(20),
    shopAddress: z.string().trim().max(250),
    city: z.string().trim().min(1, t('platform.validation.cityRequired')),
    ownerName: z
      .string()
      .trim()
      .min(2, t('platform.validation.ownerNameMin'))
      .max(100, t('platform.validation.ownerNameMax')),
    ownerPhone: z
      .string()
      .trim()
      .min(10, t('platform.validation.ownerPhoneMin'))
      .max(20, t('platform.validation.ownerPhoneMax')),
    subscriptionEndsAt: z.date({
      error: t('platform.validation.subscriptionRequired')
    })
  });
