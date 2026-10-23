export interface UnpaidBillTarget {
  id: string;
  title: string;
  date: string;
  totalAmount: number;
  remaining: number;
}

export interface PartyPaymentTargetLabels {
  paymentTarget: string;
  openingBalance: string;
  specificBill: string;
  billsCount: string;
  noUnpaidBills: string;
  date: string;
  total: string;
}

export interface PartyPaymentTargetSectionProps {
  targetType: 'opening' | 'bill';
  openingRemaining: number;
  unpaidBills: UnpaidBillTarget[];
  selectedBillId: string;
  billIdError?: string;
  onTargetTypeChange: (val: string) => void;
  onSelectBill: (billId: string) => void;
  onChooseBillTarget: () => void;
  labels: PartyPaymentTargetLabels;
}
