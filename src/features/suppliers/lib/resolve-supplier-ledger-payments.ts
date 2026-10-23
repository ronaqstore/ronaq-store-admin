import type {
  CreateSupplierPaymentInput,
  SupplierPayableDTO
} from '@/types/supplier-payment';

export function buildSupplierLedgerPaymentPlan(
  supplierId: string,
  amountPaisa: number,
  paymentDate: string,
  payable: Pick<SupplierPayableDTO, 'openingRemaining' | 'unpaidPurchases'>
): CreateSupplierPaymentInput[] {
  if (amountPaisa <= 0) return [];

  let left = amountPaisa;
  const plan: CreateSupplierPaymentInput[] = [];

  if (payable.openingRemaining > 0 && left > 0) {
    const take = Math.min(left, payable.openingRemaining);
    plan.push({
      supplierId,
      amount: take,
      paymentDate
    });
    left -= take;
  }

  for (const bill of payable.unpaidPurchases) {
    if (left <= 0) break;
    if (bill.remaining <= 0) continue;
    const take = Math.min(left, bill.remaining);
    plan.push({
      supplierId,
      purchaseId: bill.id,
      amount: take,
      paymentDate
    });
    left -= take;
  }

  if (left > 0) {
    const last = plan[plan.length - 1];
    if (last) {
      last.amount += left;
    } else {
      plan.push({
        supplierId,
        amount: amountPaisa,
        paymentDate
      });
    }
  }

  return plan;
}
