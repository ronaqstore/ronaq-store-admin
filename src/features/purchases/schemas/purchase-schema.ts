import * as z from 'zod';
import type { useTranslations } from 'next-intl';
import { INPUT_LIMITS } from '@/lib/input-limits';

type Translator = ReturnType<typeof useTranslations>;

const IMEI_PATTERN = /^[0-9A-Za-z]{4,20}$/;

export function parseImeiList(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export const createPurchaseFormSchema = (t: Translator) =>
  z
    .object({
      supplier_id: z.string().min(1, t('validation.supplierRequired')),
      supplier_invoice_ref: z.string(),
      is_opening_stock: z.boolean(),
      paid_now: z.number().min(0, t('validation.valueNonNegative')),
      lines: z
        .array(
          z
            .object({
              product_id: z.string().min(1, t('validation.productRequired')),
              quantity: z.number().int().positive(t('validation.quantityPositive')),
              unit_cost: z.number().min(0, t('validation.valueNonNegative')),
              imeis_text: z.string(),
              imei2_text: z.string(),
              condition: z.enum(['NEW', 'USED']),
              tracking_type: z.enum(['QUANTITY', 'SERIALIZED']).optional()
            })
            .superRefine((line, ctx) => {
              const imeis = parseImeiList(line.imeis_text);

              if (line.tracking_type === 'QUANTITY' && imeis.length > 0) {
                ctx.addIssue({
                  code: 'custom',
                  path: ['imeis_text'],
                  message: t('validation.imeisNotAllowed')
                });
                return;
              }

              if (line.tracking_type !== 'SERIALIZED') return;

              if (imeis.length === 0) {
                ctx.addIssue({
                  code: 'custom',
                  path: ['imeis_text'],
                  message: t('validation.imeiRequired')
                });
                return;
              }

              if (imeis.length > INPUT_LIMITS.imeiCountMax) {
                ctx.addIssue({
                  code: 'custom',
                  path: ['imeis_text'],
                  message: t('validation.imeiCountMax', {
                    max: INPUT_LIMITS.imeiCountMax
                  })
                });
                return;
              }

              if (imeis.length !== line.quantity) {
                ctx.addIssue({
                  code: 'custom',
                  path: ['imeis_text'],
                  message: t('validation.imei1CountMismatch', {
                    quantity: line.quantity
                  })
                });
              }

              const seen = new Set<string>();
              for (const imei of imeis) {
                if (!IMEI_PATTERN.test(imei)) {
                  ctx.addIssue({
                    code: 'custom',
                    path: ['imeis_text'],
                    message: t('validation.imeiInvalidFormat')
                  });
                  break;
                }
                if (seen.has(imei)) {
                  ctx.addIssue({
                    code: 'custom',
                    path: ['imeis_text'],
                    message: t('validation.imeiDuplicate', { imei })
                  });
                  break;
                }
                seen.add(imei);
              }
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
        for (const imei of parseImeiList(line.imeis_text)) {
          if (seenAcross.has(imei)) {
            ctx.addIssue({
              code: 'custom',
              path: ['lines', lineIdx, 'imeis_text'],
              message: t('validation.imeiDuplicate', { imei })
            });
            return;
          }
          seenAcross.add(imei);
        }
      });
    });
