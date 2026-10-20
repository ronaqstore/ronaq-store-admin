import { todayIsoDate } from '@/lib/dates';
import { toPaisa } from '@/lib/dukaan/numbers';
import type { CreateSaleInput, CreateSaleItemInput } from '@/lib/api/types';
import type { SaleLineItem, SaleTotalsSelectorState } from '@/types/sales';
import { EMPTY_FORM_NUMBER, type FormNumber } from '@/types/common';

export const emptySaleLine: SaleLineItem = {
  product_id: '',
  quantity: 1,
  unit_price: EMPTY_FORM_NUMBER,
  inventory_unit_id: '',
  unit_condition: undefined,
  warranty_days: '',
  authenticity: null
};

export function buildCreateSalePayload(
  lines: SaleLineItem[],
  customerId: string,
  discount: number,
  paidNow: number,
  notes: string | undefined,
  clientRequestId: string
): CreateSaleInput {
  const items: CreateSaleItemInput[] = lines
    .filter((l) => l.product_id)
    .map((l) => {
      const days =
        l.unit_condition === 'USED' && l.warranty_days
          ? Number(l.warranty_days)
          : undefined;
      return {
        productId: l.product_id,
        quantity: Number(l.quantity) || 1,
        unitPrice: toPaisa(Number(l.unit_price) || 0),
        inventoryUnitId: l.inventory_unit_id || undefined,
        warrantyDays:
          days === 1 || days === 2 || days === 3 ? days : undefined
      };
    });

  return {
    clientRequestId,
    saleDate: todayIsoDate(),
    customerId: customerId === '__walkin__' ? undefined : customerId,
    items,
    discount: toPaisa(Number(discount) || 0),
    paidNow: toPaisa(Number(paidNow) || 0),
    notes: notes?.trim() || undefined
  };
}

export function calcSaleTotals(
  lines: SaleLineItem[],
  discount: FormNumber,
  paidNow: FormNumber
) {
  const subtotalRs = lines.reduce(
    (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unit_price) || 0),
    0
  );
  const totalRs = Math.max(0, subtotalRs - (Number(discount) || 0));
  const udharRs = Math.max(0, totalRs - (Number(paidNow) || 0));
  return { subtotalRs, totalRs, udharRs };
}

export function selectSaleTotals(state: SaleTotalsSelectorState) {
  return {
    lines: state.values.lines,
    discount: state.values.discount,
    paidNow: state.values.paid_now
  };
}
