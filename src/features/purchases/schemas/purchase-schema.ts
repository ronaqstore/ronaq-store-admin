import * as z from 'zod';
import type { useTranslations } from 'next-intl';
import { INPUT_LIMITS } from '@/lib/input-limits';
import type { PurchasePhoneUnitDraft } from '@/types';

type Translator = ReturnType<typeof useTranslations>;

const IMEI_PATTERN = /^\d{15}$/;

const phoneUnitSchema = (t: Translator) =>
  z.object({
    imei1: z
      .string()
      .min(1, t('validation.imeiRequired'))
      .regex(IMEI_PATTERN, t('validation.imeiInvalidFormat')),
    imei2: z
      .string()
      .min(1, t('validation.imei2Required'))
      .regex(IMEI_PATTERN, t('validation.imeiInvalidFormat')),
    condition: z.enum(['NEW', 'USED']),
    battery_health: z.union([z.number(), z.literal('')]).optional(),
    asking_price: z.union([z.number(), z.literal('')]).optional(),
    defect_notes: z.string().optional()
  });

export const createPurchaseFormSchema = (t: Translator) =>
  z
    .object({
      supplier_id: z.string().min(1, t('validation.supplierRequired')),
      supplier_invoice_ref: z.string(),
      is_opening_stock: z.boolean(),
      paid_now: z.union([
        z.number().min(0, t('validation.valueNonNegative')),
        z.literal('')
      ]),
      lines: z
        .array(
          z
            .object({
              product_id: z.string().min(1, t('validation.productRequired')),
              quantity: z.union([
                z.number().int().positive(t('validation.quantityPositive')),
                z.literal('')
              ]),
              unit_cost: z.union([
                z.number().min(0, t('validation.valueNonNegative')),
                z.literal('')
              ]),
              phone_units: z.array(phoneUnitSchema(t)),
              condition: z.enum(['NEW', 'USED']),
              tracking_type: z.enum(['QUANTITY', 'SERIALIZED']).optional()
            })
            .superRefine((line, ctx) => {
              if (line.tracking_type === 'QUANTITY' && line.phone_units.length > 0) {
                ctx.addIssue({
                  code: 'custom',
                  path: ['phone_units'],
                  message: t('validation.imeisNotAllowed')
                });
                return;
              }

              if (line.tracking_type !== 'SERIALIZED') return;

              const quantity = Number(line.quantity) || 0;

              if (quantity > INPUT_LIMITS.imeiCountMax) {
                ctx.addIssue({
                  code: 'custom',
                  path: ['quantity'],
                  message: t('validation.imeiCountMax', {
                    max: INPUT_LIMITS.imeiCountMax
                  })
                });
                return;
              }

              if (line.phone_units.length !== quantity) {
                ctx.addIssue({
                  code: 'custom',
                  path: ['phone_units'],
                  message: t('validation.phoneUnitsCountMismatch', {
                    quantity
                  })
                });
              }

              const seen = new Set<string>();
              line.phone_units.forEach((unit, unitIdx) => {
                if (unit.imei1 && unit.imei2 && unit.imei1 === unit.imei2) {
                  ctx.addIssue({
                    code: 'custom',
                    path: ['phone_units', unitIdx, 'imei2'],
                    message: t('validation.imeiPairMustDiffer')
                  });
                }
                for (const [field, imei] of [
                  ['imei1', unit.imei1],
                  ['imei2', unit.imei2]
                ] as const) {
                  if (!imei) continue;
                  if (seen.has(imei)) {
                    ctx.addIssue({
                      code: 'custom',
                      path: ['phone_units', unitIdx, field],
                      message: t('validation.imeiDuplicate', { imei })
                    });
                  }
                  seen.add(imei);
                }
              });
            })
        )
        .min(1, t('validation.lineItemsMinOne'))
    })
    .superRefine((value, ctx) => {
      const totalRs = value.lines.reduce(
        (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unit_cost) || 0),
        0
      );
      const paidNow = Number(value.paid_now) || 0;

      if (value.is_opening_stock && paidNow > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['paid_now'],
          message: t('validation.openingStockNoPayment')
        });
      }

      if (!value.is_opening_stock && paidNow > totalRs) {
        ctx.addIssue({
          code: 'custom',
          path: ['paid_now'],
          message: t('validation.paidExceedsTotal')
        });
      }

      const seenAcross = new Set<string>();
      value.lines.forEach((line, lineIdx) => {
        if (line.tracking_type !== 'SERIALIZED') return;
        line.phone_units.forEach((unit, unitIdx) => {
          for (const [field, imei] of [
            ['imei1', unit.imei1],
            ['imei2', unit.imei2]
          ] as const) {
            if (!imei) continue;
            if (seenAcross.has(imei)) {
              ctx.addIssue({
                code: 'custom',
                path: ['lines', lineIdx, 'phone_units', unitIdx, field],
                message: t('validation.imeiDuplicate', { imei })
              });
              return;
            }
            seenAcross.add(imei);
          }
        });
      });
    });

export function emptyPhoneUnit(condition: 'NEW' | 'USED' = 'NEW') {
  return {
    imei1: '',
    imei2: '',
    condition,
    battery_health: '' as const,
    asking_price: '' as const,
    defect_notes: ''
  };
}

export function resizePhoneUnits(
  units: PurchasePhoneUnitDraft[],
  quantity: number,
  defaultCondition: 'NEW' | 'USED'
) {
  const next = units.slice(0, quantity);
  while (next.length < quantity) {
    next.push(emptyPhoneUnit(defaultCondition));
  }
  return next;
}
