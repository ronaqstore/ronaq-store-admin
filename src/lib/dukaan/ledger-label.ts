export type LedgerLabelTranslator = (
  key: string,
  values?: Record<string, string | number>
) => string;

export function formatPartyLedgerLabel(
  type: string,
  reference: string | null | undefined,
  status: string | undefined,
  t: LedgerLabelTranslator
): string {
  const cancelled =
    status && status !== 'ACTIVE' ? ` (${t('status.cancelled')})` : '';

  switch (type) {
    case 'SALE':
      return `${t('dukaan.party.ledgerSale', { ref: reference ?? '—' })}${cancelled}`;
    case 'PAYMENT':
      return reference
        ? `${t('dukaan.party.ledgerPaymentOnBill', { ref: reference })}${cancelled}`
        : `${t('dukaan.party.ledgerPaymentOnOpening')}${cancelled}`;
    case 'RETURN':
      return `${t('dukaan.party.ledgerReturn', { ref: reference ?? '—' })}${cancelled}`;
    case 'REFUND':
      return `${t('dukaan.party.ledgerRefund', { ref: reference ?? '—' })}${cancelled}`;
    case 'PURCHASE':
      return `${t('dukaan.party.ledgerPurchase', { ref: reference ?? '—' })}${cancelled}`;
    case 'SUPPLIER_PAYMENT':
      return reference
        ? `${t('dukaan.party.ledgerSupplierPaymentOnBill', { ref: reference })}${cancelled}`
        : `${t('dukaan.party.ledgerSupplierPaymentOnOpening')}${cancelled}`;
    default:
      return reference ? `${type} ${reference}${cancelled}` : `${type}${cancelled}`;
  }
}
