import { z } from 'zod';
import type { useTranslations } from 'next-intl';

type Translator = ReturnType<typeof useTranslations>;

export const createProductFormSchema = (t: Translator) =>
  z.object({
    name: z.string().trim().min(2, t('validation.productNameMin2Chars')),
    categoryId: z.string().min(1, t('validation.categoryRequired')),
    brandId: z.string().min(1, t('validation.brandRequired')),
    trackingType: z.enum(['QUANTITY', 'SERIALIZED']),
    model: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    ram: z.string().optional().nullable(),
    storage: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    defaultPurchasePrice: z.coerce
      .number()
      .min(0, t('validation.valueNonNegative'))
      .optional()
      .nullable(),
    defaultSellingPrice: z.coerce
      .number()
      .min(0, t('validation.valueNonNegative'))
      .optional()
      .nullable(),
    lowStockThreshold: z.coerce
      .number({ error: t('validation.lowStockThresholdRequired') })
      .min(0, t('validation.valueNonNegative')),
    isActive: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    publicDescription: z.string().optional().nullable(),
    contactForPrice: z.boolean().optional(),
    ptaStatus: z
      .enum(['PTA_APPROVED', 'NON_PTA', 'JV', 'BYPASS', 'MDM_BYPASS'])
      .optional()
      .nullable(),
    authenticity: z.enum(['ORIGINAL', 'COPY', '']).optional().nullable()
  });
