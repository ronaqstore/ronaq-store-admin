import type { ReactNode } from 'react';
import type { PaymentDTO, CustomerDTO, CancelPaymentInput } from '@/lib/api/types';
import type { EntityComboboxItem } from './common';

export interface CustomerComboboxItem extends EntityComboboxItem {
  raw: CustomerDTO;
}

export type PaymentMethodOption =
  | 'CASH'
  | 'JAZZCASH'
  | 'EASYPAISA'
  | 'BANK'
  | 'BANK_TRANSFER'
  | 'CHEQUE'
  | 'OTHER';

export interface PaymentRowActionsProps {
  payment: PaymentDTO;
  onCancel: (payment: PaymentDTO) => void;
}

export interface PaymentsTableProps {
  toolbarAction?: ReactNode;
  searchParams?: Record<string, string | string[] | undefined>;
}

export interface CancelPaymentDialogProps {
  payment: PaymentDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface CustomerSelectComboboxProps {
  value: string;
  onSelectCustomer: (customer: CustomerDTO | null) => void;
  selectedCustomer?: CustomerDTO | null;
  placeholder?: string;
  disabled?: boolean;
}

export interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCustomerId?: string;
  onSuccess?: () => void;
}

export interface PaymentsListFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  saleId?: string;
  receiptGroupId?: string;
  status?: 'ACTIVE' | 'CANCELLED';
  from?: string;
  to?: string;
  sortBy?: 'paymentDate' | 'amount' | 'createdAt' | 'updatedAt' | 'customerName' | 'method';
  sortOrder?: 'asc' | 'desc';
}

export interface CancelPaymentMutationVariables {
  id: string;
  input: CancelPaymentInput;
}

export interface CancelPaymentResult {
  success: boolean;
  confirmOverdraft?: boolean;
  shortfall?: number;
  message?: string;
}

export interface PaymentCreateBody {
  notes?: string;
  method?: string;
  [key: string]: unknown;
}

export interface RecordPaymentFormErrors {
  customerId?: string;
  amount?: string;
  saleId?: string;
}

export interface UnpaidSaleDTO {
  id: string;
  saleNo: string;
  saleDate: string;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
}

export interface CustomerReceivableDTO {
  customerId: string;
  customerName: string;
  openingBalance: number;
  openingRemaining: number;
  totalSales: number;
  totalPaid: number;
  receivable: number;
  unpaidSales: UnpaidSaleDTO[];
}

export interface PaymentTargetLabels {
  paymentTarget: string;
  openingBalance: string;
  specificBill: string;
  billsCount: string;
  noUnpaidBills: string;
  saleNo: (saleNo: string) => string;
  date: string;
  total: string;
  remaining: string;
}

export interface PaymentTargetSectionProps {
  targetType: 'opening' | 'sale';
  openingRemaining: number;
  unpaidSales: UnpaidSaleDTO[];
  selectedSaleId: string;
  saleIdError?: string;
  onTargetTypeChange: (val: string) => void;
  onSelectSale: (saleId: string) => void;
  onChooseSaleTarget: () => void;
  labels: PaymentTargetLabels;
}
