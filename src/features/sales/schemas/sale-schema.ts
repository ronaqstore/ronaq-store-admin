import * as z from 'zod';
import type { useTranslations } from 'next-intl';

type Translator = ReturnType<typeof useTranslations>;

const WALK_IN = '__walkin__';

export const createSaleFormSchema = (t: Translator) =>
  z
    .object({
      customer_id: z.string(),
      discount: z.number().min(0, t('validation.valueNonNegative')),
      paid_now: z.number().min(0, t('validation.valueNonNegative')),
      notes: z.string(),
      lines: z
        .array(
          z
            .object({
              product_id: z.string().min(1, t('validation.productRequired')),
              quantity: z.number().int().positive(t('validation.quantityPositive')),
              unit_price: z.number().min(0, t('validation.valueNonNegative')),
              inventory_unit_id: z.string().optional(),
              tracking_type: z.enum(['QUANTITY', 'SERIALIZED']).optional(),
              unit_condition: z.enum(['NEW', 'USED']).optional(),
              warranty_days: z.string().optional()
            })
            .superRefine((line, ctx) => {
              if (line.tracking_type !== 'SERIALIZED') return;

              if (line.quantity !== 1) {
                ctx.addIssue({
                  code: 'custom',
                  path: ['quantity'],
                  message: t('validation.phoneQuantityMustBeOne')
                });
              }

              if (!line.inventory_unit_id?.trim()) {
                ctx.addIssue({
                  code: 'custom',
                  path: ['inventory_unit_id'],
                  message: t('validation.inventoryUnitRequired')
                });
              }

              const days = line.warranty_days?.trim();
              if (line.unit_condition === 'USED') {
                if (days !== '1' && days !== '2' && days !== '3') {
                  ctx.addIssue({
                    code: 'custom',
                    path: ['warranty_days'],
                    message: t('validation.warrantyDaysRequired')
                  });
                }
              } else if (days) {
                ctx.addIssue({
                  code: 'custom',
                  path: ['warranty_days'],
                  message: t('validation.warrantyDaysNotAllowed')
                });
              }
            })
        )
        .min(1, t('validation.lineItemsMinOne'))
    })
    .superRefine((value, ctx) => {
      const lines = value.lines.filter((l) => l.product_id);
      const hasPhone = lines.some((l) => l.tracking_type === 'SERIALIZED');
      const subtotalRs = lines.reduce(
        (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
        0
      );
      const discount = Number(value.discount) || 0;
      const paidNow = Number(value.paid_now) || 0;
      const totalRs = Math.max(0, subtotalRs - discount);
      const isWalkIn = !value.customer_id || value.customer_id === WALK_IN;
      const isUdhar = totalRs - paidNow > 0;

      if (discount > subtotalRs) {
        ctx.addIssue({
          code: 'custom',
          path: ['discount'],
          message: t('validation.discountExceedsSubtotal')
        });
      }

      if (paidNow > totalRs) {
        ctx.addIssue({
          code: 'custom',
          path: ['paid_now'],
          message: t('validation.paidExceedsTotal')
        });
      }

      if (isWalkIn && hasPhone) {
        ctx.addIssue({
          code: 'custom',
          path: ['customer_id'],
          message: t('validation.customerForPhones')
        });
      }

      if (isWalkIn && isUdhar) {
        ctx.addIssue({
          code: 'custom',
          path: ['customer_id'],
          message: t('validation.customerForUdhar')
        });
      }
    });
