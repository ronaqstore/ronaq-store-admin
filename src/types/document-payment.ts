export type DocumentPaymentState = 'PAID' | 'PARTIAL' | 'UDHAR' | 'PAYABLE';

export type DocumentColumnPriority = 1 | 2 | 3 | 4;

export interface PaymentAmountLine {
  amount: number;
  status?: string;
}

export interface DocumentPayBadge {
  label: string;
  status: string;
}

export type DocumentPayTranslator = (key: string) => string;

export interface DocumentStatusFilterOption {
  label: string;
  value: string;
}

export interface HasDocumentPayments {
  totalAmount: number;
  status: string;
  payments?: PaymentAmountLine[] | null;
  isOpeningStock?: boolean;
}

export interface DocumentMoneyColumnOptions {
  totalPriority?: DocumentColumnPriority;
  paidPriority?: DocumentColumnPriority;
  outstandingPriority?: DocumentColumnPriority;
  hidePaidForOpeningStock?: boolean;
}
