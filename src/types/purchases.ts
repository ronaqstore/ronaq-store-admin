import type { ReactNode } from 'react';
import type { CancelPurchaseInput, PurchaseDTO } from '@/lib/api/types';
import type { TrackingType } from '@/lib/api/types';
import type { ProductPickerItem } from '@/types/picker';
import type { FormNumber } from './common';
import type { OverdraftPrompt } from './cash';

export interface QuickVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (product: ProductPickerItem) => void;
}

export interface QuickVariantDialogBodyProps {
  onOpenChange: (open: boolean) => void;
  onCreated: (product: ProductPickerItem) => void;
}

export interface SuggestVariantNameParts {
  brandLabel?: string;
  model?: string;
  color?: string;
  storage?: string;
  ptaStatus?: string | null;
  authenticity?: string;
  trackingType: string;
}

export interface PurchasesListFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  supplierId?: string;
  status?: 'ACTIVE' | 'CANCELLED';
  payStatus?: 'PAID' | 'PARTIAL' | 'PAYABLE' | 'CANCELLED';
  isOpeningStock?: boolean;
  from?: string;
  to?: string;
  minTotalAmount?: number;
  maxTotalAmount?: number;
  minPaidAmount?: number;
  maxPaidAmount?: number;
  minOutstandingAmount?: number;
  maxOutstandingAmount?: number;
  sortBy?:
    | 'purchaseDate'
    | 'purchaseNo'
    | 'totalAmount'
    | 'paid'
    | 'outstanding'
    | 'status'
    | 'createdAt'
    | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CancelPurchaseMutationVariables {
  id: string;
  input: CancelPurchaseInput;
}

export interface CancelPurchaseResult {
  success?: boolean;
  message?: string;
  confirmOverdraft?: boolean;
  shortfall?: number;
}

export interface CancelPurchaseDialogProps {
  purchase: PurchaseDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export type PurchasePhoneUnitDraft = {
  imei1: string;
  imei2: string;
  condition: 'NEW' | 'USED';
  battery_health?: number | '';
  asking_price?: number | '';
  defect_notes?: string;
};

export interface PurchaseLineItem {
  product_id: string;
  product_label?: string;
  quantity: FormNumber;
  unit_cost: FormNumber;
  phone_units: PurchasePhoneUnitDraft[];
  condition: 'NEW' | 'USED';
  tracking_type?: TrackingType;
  brand_name?: string | null;
}

export interface PurchaseFormValues {
  supplier_id: string;
  supplier_invoice_ref: string;
  is_opening_stock: boolean;
  paid_now: FormNumber;
  lines: PurchaseLineItem[];
}

export type PurchaseLineDraft = PurchaseLineItem;

export interface PurchaseDetailClientProps {
  id: string;
}

export interface PurchaseRowActionsProps {
  purchase: PurchaseDTO;
}

export interface PurchasesTableProps {
  toolbarAction?: ReactNode;
}

export interface PurchasesHeaderActionProps {
  className?: string;
  onAdd: () => void;
}

export interface PurchasesListClientProps {
  defaultOpenAdd?: boolean;
}

export interface PurchaseSummaryCardProps {
  isOpeningStock: boolean;
  lines: PurchaseLineItem[];
  paidNow: FormNumber;
  paidNowField: ReactNode;
  warning: OverdraftPrompt | null;
  saving: boolean;
  onConfirmOverdraft: () => void;
  onCancel: () => void;
}

export interface PurchaseSummarySelectorState {
  values: PurchaseFormValues;
}

export interface OpeningStockChangeArgs {
  value: boolean;
}
