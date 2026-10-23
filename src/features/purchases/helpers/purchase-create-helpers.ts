import { todayIsoDate } from '@/lib/dates';
import { toPaisa } from '@/lib/dukaan/numbers';
import type {
  CreatePurchaseInput,
  CreatePurchaseItemInput,
  CreatePurchasePhoneUnitInput
} from '@/lib/api/types';
import type {
  PurchaseFormValues,
  PurchaseLineDraft,
  PurchasePhoneUnitDraft,
  PurchaseSummarySelectorState
} from '@/types/purchases';
import { EMPTY_FORM_NUMBER } from '@/types/common';

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

  return {
    imei1: unit.imei1.trim(),
    imei2: unit.imei2.trim(),
    condition: unit.condition,
    ...(batteryHealth != null ? { batteryHealth } : {}),
    ...(askingRs != null ? { askingPrice: toPaisa(askingRs) } : {}),
    ...(defectNotes ? { defectNotes } : {})
  };
}

function mapPurchaseLine(line: PurchaseLineDraft): CreatePurchaseItemInput | null {
  if (!line.product_id) return null;

  const phoneUnits =
    line.tracking_type === 'SERIALIZED'
      ? (line.phone_units ?? []).map(mapPhoneUnit)
      : undefined;

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
