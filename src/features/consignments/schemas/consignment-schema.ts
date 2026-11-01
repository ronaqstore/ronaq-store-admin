import * as z from 'zod';
import type { useTranslations } from 'next-intl';
import { isOptionalPkCnic, isValidPkMobileNumber } from '@/lib/validation/pk';

type Translator = ReturnType<typeof useTranslations>;

const IMEI_PATTERN = /^\d{15}$/;

export const createConsignmentFormSchema = (t: Translator) =>
  z
    .object({
      customerId: z.string().optional().nullable(),
      consignorName: z
        .string()
        .trim()
        .min(1, t('validation.nameRequired'))
        .max(200, t('validation.nameTooLong')),
      consignorPhone: z
        .string()
        .trim()
        .min(1, t('validation.phoneRequired'))
        .refine(isValidPkMobileNumber, t('validation.phoneInvalidPk')),
      consignorCnic: z
        .string()
        .trim()
        .refine(isOptionalPkCnic, t('validation.invalidCnic'))
        .optional()
        .nullable(),
      productId: z.string().min(1, t('validation.productRequired')),
      imei1: z
        .string()
        .trim()
        .min(1, t('validation.imeiRequired'))
        .regex(IMEI_PATTERN, t('validation.imeiInvalidFormat')),
      imei2: z.string().trim().optional().nullable(),
      condition: z.enum(['NEW', 'LIKE_NEW', 'USED', 'REFURBISHED']),
      batteryHealth: z
        .union([
          z
            .number()
            .int()
            .min(0, t('consignments.batteryMin'))
            .max(100, t('consignments.batteryMax')),
          z.literal('')
        ])
        .optional()
        .nullable(),
      defectNotes: z.string().trim().optional().nullable(),
      agreedPayoutRupees: z.union([
        z.number().positive(t('consignments.payoutPositive')),
        z.literal('')
      ]),
      targetSellingPriceRupees: z
        .union([z.number().positive(t('consignments.targetPositive')), z.literal('')])
        .optional()
        .nullable(),
      intakeDate: z.string().min(1, t('validation.dateRequired')),
      notes: z.string().trim().optional().nullable()
    })
    .superRefine((val, ctx) => {
      if (typeof val.agreedPayoutRupees !== 'number' || val.agreedPayoutRupees <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['agreedPayoutRupees'],
          message: t('consignments.payoutPositive')
        });
      }

      const imei2Trimmed = val.imei2?.trim();
      if (imei2Trimmed) {
        if (!IMEI_PATTERN.test(imei2Trimmed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['imei2'],
            message: t('validation.imeiInvalidFormat')
          });
        }
        if (imei2Trimmed === val.imei1?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['imei2'],
            message: t('consignments.imeiDifferent')
          });
        }
      }

      if (
        typeof val.targetSellingPriceRupees === 'number' &&
        typeof val.agreedPayoutRupees === 'number' &&
        val.targetSellingPriceRupees < val.agreedPayoutRupees
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['targetSellingPriceRupees'],
          message: t('consignments.targetMinAgreed')
        });
      }
    });

export const returnConsignmentFormSchema = (t: Translator) =>
  z.object({
    returnReason: z
      .string()
      .trim()
      .min(1, t('validation.reasonRequired'))
      .max(500, t('consignments.reasonTooLong')),
    notes: z.string().trim().optional().nullable()
  });

export const settleConsignmentFormSchema = (t: Translator) =>
  z.object({
    settledAmountRupees: z.number().positive(t('consignments.settlePositive')),
    payoutMethod: z.enum(['CASH', 'BANK', 'JAZZCASH', 'EASYPAISA']),
    payoutReference: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable()
  });

export const cancelConsignmentFormSchema = (t: Translator) =>
  z.object({
    cancelReason: z
      .string()
      .trim()
      .min(1, t('validation.reasonRequired'))
      .max(500, t('consignments.reasonTooLong'))
  });
