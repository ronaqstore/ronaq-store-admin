'use client';

import { PartyPaymentTargetSection } from '@/components/common/party-payment-target-section';
import type { PaymentTargetSectionProps } from '@/types/payment';

export function PaymentTargetSection({
  targetType,
  openingRemaining,
  unpaidSales,
  selectedSaleId,
  saleIdError,
  onTargetTypeChange,
  onSelectSale,
  onChooseSaleTarget,
  labels
}: PaymentTargetSectionProps) {
  return (
    <PartyPaymentTargetSection
      targetType={targetType === 'sale' ? 'bill' : 'opening'}
      openingRemaining={openingRemaining}
      unpaidBills={unpaidSales.map((sale) => ({
        id: sale.id,
        title: labels.saleNo(sale.saleNo),
        date: sale.saleDate,
        totalAmount: sale.totalAmount,
        remaining: sale.remaining
      }))}
      selectedBillId={selectedSaleId}
      billIdError={saleIdError}
      onTargetTypeChange={(val) =>
        onTargetTypeChange(val === 'bill' ? 'sale' : 'opening')
      }
      onSelectBill={onSelectSale}
      onChooseBillTarget={onChooseSaleTarget}
      labels={{
        paymentTarget: labels.paymentTarget,
        openingBalance: labels.openingBalance,
        specificBill: labels.specificBill,
        billsCount: labels.billsCount,
        noUnpaidBills: labels.noUnpaidBills,
        date: labels.date,
        total: labels.total
      }}
    />
  );
}
