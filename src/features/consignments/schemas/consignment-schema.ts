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
      condition: z.enum(['NEW', 'USED']),
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
        .union([z.number().positive(), z.literal('')])
        .optional()
        .nullable(),
      intakeDate: z.string().min(1, t('validation.dateRequired')),
      notes: z.string().trim().optional().nullable()
    })
    .superRefine((val, ctx) => {
      if (val.imei2 && val.imei2.length > 0) {
        if (!IMEI_PATTERN.test(val.imei2)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation.imeiInvalidFormat'),
            path: ['imei2']
          });
        }
        if (val.imei1 === val.imei2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation.imeiDuplicate'),
            path: ['imei2']
          });
        }
      }

      if (typeof val.agreedPayoutRupees === 'number' && val.agreedPayoutRupees <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('consignments.payoutPositive'),
          path: ['agreedPayoutRupees']
        });
      }

      if (val.agreedPayoutRupees === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('consignments.payoutPositive'),
          path: ['agreedPayoutRupees']
        });
      }

      if (
        typeof val.targetSellingPriceRupees === 'number' &&
        typeof val.agreedPayoutRupees === 'number'
      ) {
        if (val.targetSellingPriceRupees < val.agreedPayoutRupees) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('consignments.targetLesserThanPayout'),
            path: ['targetSellingPriceRupees']
          });
        }
      }
    });

export const returnConsignmentFormSchema = (t: Translator) =>
  z.object({
    returnReason: z
      .string()
      .trim()
      .min(1, t('validation.reasonRequired'))
      .max(500, t('consignments.reasonTooLong'))
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

export function mapZodIssuesToErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key && typeof key === 'string' && !result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}
