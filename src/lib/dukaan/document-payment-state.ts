import type {
  DocumentPaymentState,
  PaymentAmountLine
} from '@/types/document-payment';

export type { DocumentPaymentState } from '@/types/document-payment';

export function sumActivePaid(
  payments: PaymentAmountLine[] | null | undefined
): number {
  return (payments ?? [])
    .filter((p) => (p.status ?? 'ACTIVE') === 'ACTIVE')
    .reduce((acc, p) => acc + p.amount, 0);
}

export function outstandingAmount(totalAmount: number, paid: number): number {
  return Math.max(0, totalAmount - paid);
}

export function salePaymentState(
  totalAmount: number,
  paid: number
): DocumentPaymentState {
  if (paid <= 0) return 'UDHAR';
  if (paid >= totalAmount) return 'PAID';
  return 'PARTIAL';
}

export function purchasePaymentState(
  totalAmount: number,
  paid: number,
  isOpeningStock?: boolean
): DocumentPaymentState {
  if (isOpeningStock) return 'PAID';
  if (paid <= 0) return 'PAYABLE';
  if (paid >= totalAmount) return 'PAID';
  return 'PARTIAL';
}
