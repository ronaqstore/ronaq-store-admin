import {
  purchasePaymentState,
  salePaymentState,
  sumActivePaid
} from './document-payment-state';
import type {
  DocumentPayBadge,
  DocumentPayTranslator,
  HasDocumentPayments
} from '@/types/document-payment';

export function salePayBadge(
  sale: HasDocumentPayments,
  t: DocumentPayTranslator
): DocumentPayBadge {
  if (sale.status === 'CANCELLED') {
    return { label: t('status.cancelled'), status: 'CANCELLED' };
  }
  const paid = sumActivePaid(sale.payments);
  const state = salePaymentState(sale.totalAmount, paid);
  if (state === 'PAID') return { label: t('status.paid'), status: 'PAID' };
  if (state === 'PARTIAL') return { label: t('status.partial'), status: 'PARTIAL' };
  return { label: t('status.udhar'), status: 'UDHAR' };
}

export function purchasePayBadge(
  purchase: HasDocumentPayments,
  t: DocumentPayTranslator
): DocumentPayBadge {
  if (purchase.status === 'CANCELLED') {
    return { label: t('status.cancelled'), status: 'CANCELLED' };
  }
  if (purchase.isOpeningStock) {
    return { label: t('purchases.openingBadge'), status: 'ACTIVE' };
  }
  const paid = sumActivePaid(purchase.payments);
  const state = purchasePaymentState(
    purchase.totalAmount,
    paid,
    purchase.isOpeningStock
  );
  if (state === 'PAID') return { label: t('status.paid'), status: 'PAID' };
  if (state === 'PARTIAL') return { label: t('status.partial'), status: 'PARTIAL' };
  return { label: t('status.payable'), status: 'PAYABLE' };
}
