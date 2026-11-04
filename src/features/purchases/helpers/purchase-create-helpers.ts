import { todayIsoDate } from '@/lib/dates';
import { fromPaisa, toPaisa } from '@/lib/dukaan/numbers';
import type {
  CreatePurchaseInput,
  CreatePurchaseItemInput,
  CreatePurchasePhoneUnitInput,
  ProductDTO
} from '@/lib/api/types';
import type {
  PurchaseFormValues,
  PurchaseLineDraft,
  PurchaseLineItem,
  PurchasePhoneUnitDraft,
  PurchaseSummarySelectorState
} from '@/types/purchases';
import { EMPTY_FORM_NUMBER } from '@/types/common';
import { resizePhoneUnits } from '../schemas/purchase-schema';

export function emptyPurchaseLine(): PurchaseLineDraft {
  return {
    product_id: '',
    product_label: '',
    quantity: EMPTY_FORM_NUMBER,
    unit_cost: EMPTY_FORM_NUMBER,
    phone_units: [],
    condition: 'NEW',
    tracking_type: undefined,
    brand_name: null
  };
}

function optionalNumber(value: number | '' | null | undefined): number | undefined {
  if (value === '' || value == null) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function mapPhoneUnit(unit: PurchasePhoneUnitDraft): CreatePurchasePhoneUnitInput {
  const batteryHealth = optionalNumber(unit.battery_health);
  const askingRs = optionalNumber(unit.asking_price);
  const defectNotes = unit.defect_notes?.trim() || undefined;

  const imei2 = unit.imei2?.trim() || undefined;

  return {
    imei1: unit.imei1.trim(),
    ...(imei2 ? { imei2 } : {}),
    condition: unit.condition,
    ...(batteryHealth != null ? { batteryHealth } : {}),
    ...(askingRs != null ? { askingPrice: toPaisa(askingRs) } : {}),
    ...(defectNotes ? { defectNotes } : {})
  };
}

function mapPurchaseLine(line: PurchaseLineDraft): CreatePurchaseItemInput | null {
  if (!line.product_id) return null;

  const phoneUnits =
    line.tracking_type === 'SERIALIZED' ? (line.phone_units ?? []).map(mapPhoneUnit) : undefined;

  return {
    productId: line.product_id,
    quantity: Number(line.quantity) || 1,
    unitCost: toPaisa(Number(line.unit_cost) || 0),
    condition: line.condition,
    phoneUnits: phoneUnits && phoneUnits.length > 0 ? phoneUnits : undefined
  };
}

export function buildCreatePurchasePayload(
  values: PurchaseFormValues,
  clientRequestId: string,
  confirmOverdraft = false
): CreatePurchaseInput {
  const items = values.lines
    .map(mapPurchaseLine)
    .filter((item): item is CreatePurchaseItemInput => item != null);

  return {
    clientRequestId,
    supplierId: values.supplier_id,
    supplierInvoiceRef: values.supplier_invoice_ref?.trim() || undefined,
    purchaseDate: todayIsoDate(),
    isOpeningStock: values.is_opening_stock,
    paidNow: values.is_opening_stock ? 0 : toPaisa(Number(values.paid_now) || 0),
    confirmOverdraft,
    items
  };
}

export function calcPurchaseLineTotalRs(lines: PurchaseLineDraft[]): number {
  return lines.reduce(
    (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unit_cost) || 0),
    0
  );
}

export function calcPurchaseDueRs(totalRs: number, paidNow: number | ''): number {
  return Math.max(0, totalRs - (Number(paidNow) || 0));
}

export function selectPurchaseSummary(state: PurchaseSummarySelectorState) {
  return {
    isOpeningStock: state.values.is_opening_stock,
    lines: state.values.lines,
    paidNow: state.values.paid_now
  };
}

export function buildQuickPurchaseDefaults(product?: ProductDTO | null): PurchaseFormValues {
  if (!product || !product.isActive) {
    return {
      supplier_id: '',
      supplier_invoice_ref: '',
      is_opening_stock: false,
      paid_now: EMPTY_FORM_NUMBER,
      lines: [emptyPurchaseLine()]
    };
  }

  const initialCostRs =
    product.defaultPurchasePrice != null && product.defaultPurchasePrice > 0
      ? fromPaisa(product.defaultPurchasePrice)
      : EMPTY_FORM_NUMBER;

  const isPhone = product.trackingType === 'SERIALIZED';

  const initialLine: PurchaseLineItem = {
    product_id: product.id,
    product_label: product.name,
    quantity: 1,
    unit_cost: initialCostRs,
    phone_units: isPhone ? resizePhoneUnits([], 1, 'NEW') : [],
    condition: 'NEW',
    tracking_type: product.trackingType,
    brand_name: product.brandName ?? null
  };

  return {
    supplier_id: '',
    supplier_invoice_ref: '',
    is_opening_stock: false,
    paid_now: initialCostRs,
    lines: [initialLine]
  };
}
