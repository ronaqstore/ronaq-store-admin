import { todayIsoDate } from '@/lib/dates';
import { fromPaisa, toPaisa } from '@/lib/dukaan/numbers';
import type { CreateSaleInput, CreateSaleItemInput, ProductDTO } from '@/lib/api/types';
import type { SaleFormValues, SaleLineItem, SaleTotalsSelectorState } from '@/types/sales';
import { EMPTY_FORM_NUMBER, type FormNumber } from '@/types/common';

export const emptySaleLine: SaleLineItem = {
  product_id: '',
  quantity: 1,
  unit_price: EMPTY_FORM_NUMBER,
  inventory_unit_id: '',
  tracking_type: undefined,
  unit_condition: undefined,
  warranty_days: '',
  authenticity: null
};

export function isPhoneSaleLine(
  line: Pick<SaleLineItem, 'tracking_type'> | null | undefined
): boolean {
  return line?.tracking_type === 'SERIALIZED';
}

export function buildCreateSalePayload(
  lines: SaleLineItem[],
  customerId: string,
  discount: number,
  paidNow: number,
  notes: string | undefined,
  clientRequestId: string,
  confirmBelowCost = false
): CreateSaleInput {
  const items: CreateSaleItemInput[] = lines
    .filter((l) => l.product_id)
    .map((l) => {
      const days =
        l.unit_condition === 'USED' && l.warranty_days ? Number(l.warranty_days) : undefined;
      return {
        productId: l.product_id,
        quantity: Number(l.quantity) || 1,
        unitPrice: toPaisa(Number(l.unit_price) || 0),
        inventoryUnitId: l.inventory_unit_id || undefined,
        warrantyDays: days === 1 || days === 2 || days === 3 ? days : undefined
      };
    });

  return {
    clientRequestId,
    saleDate: todayIsoDate(),
    customerId: customerId === '__walkin__' ? undefined : customerId,
    items,
    discount: toPaisa(Number(discount) || 0),
    paidNow: toPaisa(Number(paidNow) || 0),
    notes: notes?.trim() || undefined,
    confirmBelowCost: confirmBelowCost || undefined
  };
}

export function calcSaleTotals(lines: SaleLineItem[], discount: FormNumber, paidNow: FormNumber) {
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

export function buildQuickSaleDefaults(product?: ProductDTO | null): SaleFormValues {
  if (!product || !product.isActive) {
    return {
      customer_id: '__walkin__',
      discount: EMPTY_FORM_NUMBER,
      paid_now: EMPTY_FORM_NUMBER,
      notes: '',
      lines: [{ ...emptySaleLine }]
    };
  }

  const initialPriceRs =
    product.defaultSellingPrice != null && product.defaultSellingPrice > 0
      ? fromPaisa(product.defaultSellingPrice)
      : EMPTY_FORM_NUMBER;

  const isPhone = product.trackingType === 'SERIALIZED';

  const initialLine: SaleLineItem = {
    product_id: product.id,
    product_name: product.name,
    quantity: 1,
    unit_price: initialPriceRs,
    tracking_type: product.trackingType,
    authenticity: isPhone ? null : (product.authenticity ?? null),
    inventory_unit_id: '',
    unit_condition: undefined,
    warranty_days: ''
  };

  return {
    customer_id: '__walkin__',
    discount: EMPTY_FORM_NUMBER,
    paid_now: initialPriceRs,
    notes: '',
    lines: [initialLine]
  };
}
