import { todayIsoDate } from '@/lib/dates';
import { fromPaisa, toPaisa } from '@/lib/dukaan/numbers';
import type {
  CreateSaleInput,
  CreateSaleItemInput,
  ProductDTO,
  ResponseResolveScanDto
} from '@/lib/api/types';
import type {
  ResolvedScanCartResult,
  SaleFormValues,
  SaleLineItem,
  SaleTotalsSelectorState
} from '@/types/sales';
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

export function getSalePricingFingerprint(
  lines: Array<Pick<SaleLineItem, 'product_id' | 'inventory_unit_id' | 'unit_price' | 'quantity'>>,
  discount: FormNumber
): string {
  return JSON.stringify({
    d: String(discount ?? '').trim(),
    l: lines.map((l) => [
      l.product_id,
      l.inventory_unit_id ?? '',
      String(l.unit_price ?? '').trim(),
      Number(l.quantity) || 1
    ])
  });
}

export function resolveScanToCart(
  result: ResponseResolveScanDto,
  currentLines: SaleLineItem[]
): ResolvedScanCartResult | null {
  if (!result.found || !result.product) return null;
  const product = result.product;

  if (result.type === 'SERIALIZED' && result.unit) {
    const unit = result.unit;
    const alreadyAdded = currentLines.some((l) => l.inventory_unit_id === unit.id);
    if (alreadyAdded) {
      return { action: 'already_added', imei: unit.imei1 };
    }

    const isFirstLineEmpty =
      currentLines.length === 1 &&
      !currentLines[0]?.product_id &&
      !currentLines[0]?.inventory_unit_id;

    const newLine: SaleLineItem = {
      product_id: product.id,
      product_name: product.name,
      tracking_type: 'SERIALIZED',
      inventory_unit_id: unit.id,
      unit_price: fromPaisa(unit.effectivePrice ?? product.defaultSellingPrice ?? 0),
      quantity: 1,
      unit_condition:
        unit.condition === 'USED' || unit.condition === 'NEW' ? unit.condition : undefined,
      warranty_days: unit.condition === 'USED' ? '30' : undefined
    };

    return {
      action: 'set_lines',
      lines: isFirstLineEmpty ? [newLine] : [...currentLines, newLine],
      itemName: `${product.name} (${unit.imei1})`
    };
  }

  if (result.type === 'QUANTITY') {
    const existingIdx = currentLines.findIndex(
      (l) => l.product_id === product.id && l.tracking_type === 'QUANTITY'
    );
    if (existingIdx >= 0) {
      const existing = currentLines[existingIdx];
      const nextQty = (existing.quantity || 1) + 1;
      return {
        action: 'update_quantity',
        lineIndex: existingIdx,
        nextQty,
        productName: product.name
      };
    }

    const isFirstLineEmpty =
      currentLines.length === 1 &&
      !currentLines[0]?.product_id &&
      !currentLines[0]?.inventory_unit_id;

    const newLine: SaleLineItem = {
      product_id: product.id,
      product_name: product.name,
      tracking_type: 'QUANTITY',
      inventory_unit_id: '',
      unit_price: fromPaisa(product.defaultSellingPrice ?? 0),
      quantity: 1
    };

    return {
      action: 'set_lines',
      lines: isFirstLineEmpty ? [newLine] : [...currentLines, newLine],
      itemName: product.name
    };
  }

  if (result.type === 'SERIALIZED_PRODUCT') {
    const isFirstLineEmpty =
      currentLines.length === 1 &&
      !currentLines[0]?.product_id &&
      !currentLines[0]?.inventory_unit_id;
    const newLine: SaleLineItem = {
      product_id: product.id,
      product_name: product.name,
      tracking_type: 'SERIALIZED',
      inventory_unit_id: '',
      unit_price: fromPaisa(product.defaultSellingPrice ?? 0),
      quantity: 1
    };
    return {
      action: 'select_unit_prompt',
      lines: isFirstLineEmpty ? [newLine] : [...currentLines, newLine],
      productName: product.name
    };
  }

  return null;
}
