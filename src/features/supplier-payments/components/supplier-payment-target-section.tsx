'use client';

import { PartyPaymentTargetSection } from '@/components/common/party-payment-target-section';
import type { SupplierPaymentTargetSectionProps } from '@/types/supplier-payment';

export function SupplierPaymentTargetSection({
  targetType,
  openingRemaining,
  unpaidPurchases,
  selectedPurchaseId,
  purchaseIdError,
  onTargetTypeChange,
  onSelectPurchase,
  onChoosePurchaseTarget,
  labels
}: SupplierPaymentTargetSectionProps) {
  return (
    <PartyPaymentTargetSection
      targetType={targetType === 'purchase' ? 'bill' : 'opening'}
      openingRemaining={openingRemaining}
      unpaidBills={unpaidPurchases.map((purchase) => ({
        id: purchase.id,
        title: purchase.supplierInvoiceRef
          ? labels.inv(purchase.supplierInvoiceRef)
          : purchase.purchaseNo,
        date: purchase.purchaseDate,
        totalAmount: purchase.totalAmount,
        remaining: purchase.remaining
      }))}
      selectedBillId={selectedPurchaseId}
      billIdError={purchaseIdError}
      onTargetTypeChange={(val) =>
        onTargetTypeChange(val === 'bill' ? 'purchase' : 'opening')
      }
      onSelectBill={onSelectPurchase}
      onChooseBillTarget={onChoosePurchaseTarget}
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
