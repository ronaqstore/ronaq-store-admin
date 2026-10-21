'use client';

import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PartyLedgerView } from '@/components/common/party-ledger-view';
import { useT } from '@/i18n/use-t';
import { toPaisa } from '@/lib/dukaan/numbers';
import { dukaanKeys, supplierQueryOptions } from '@/features/dukaan/api/queries';
import {
  supplierPayableQueryOptions,
  supplierPaymentKeys
} from '@/features/supplier-payments/api/queries';
import { createSupplierPayment } from '@/features/supplier-payments/api/service';
import { todayIsoDate } from '@/lib/dates';
import { buildSupplierLedgerPaymentPlan } from '../lib/resolve-supplier-ledger-payments';
import type { SupplierLedgerClientProps } from '@/types';

export function SupplierLedgerClient({ id }: SupplierLedgerClientProps) {
  const qc = useQueryClient();
  const t = useT();
  const { data } = useSuspenseQuery(supplierQueryOptions(id));
  const { data: payable } = useSuspenseQuery(supplierPayableQueryOptions(id));

  const pay = useMutation({
    mutationFn: async (amount: number) => {
      const plan = buildSupplierLedgerPaymentPlan(
        id,
        toPaisa(amount),
        todayIsoDate(),
        payable
      );
      let last: Awaited<ReturnType<typeof createSupplierPayment>> | undefined;
      for (const step of plan) {
        last = await createSupplierPayment(step);
        if ('confirmOverdraft' in last && last.confirmOverdraft) {
          return last;
        }
      }
      return last;
    },
    onSuccess: (res) => {
      if (res && 'confirmOverdraft' in res && res.confirmOverdraft) {
        toast.warning(res.message);
        return;
      }
      toast.success(t('dukaan.party.paymentRecorded'));
      void qc.invalidateQueries({ queryKey: dukaanKeys.supplier(id) });
      void qc.invalidateQueries({ queryKey: supplierPaymentKeys.payable(id) });
    },
    onError: (e: Error) => toast.error(e.message)
  });

  return (
    <PartyLedgerView
      name={data.name}
      phone={data.phone}
      address={data.address}
      notes={data.notes}
      openingBalance={data.openingBalance}
      currentBalance={data.payable}
      openingBalanceLabel={t('dukaan.party.supplierOpeningBalance')}
      currentBalanceLabel={t('dukaan.party.currentPayable')}
      paymentLabel={t('dukaan.party.paySupplier')}
      isPaying={pay.isPending}
      onPay={(amount) => pay.mutateAsync(amount)}
      ledger={data.ledger}
      backHref='/dashboard/suppliers'
      backLabel={t('dukaan.party.backToSuppliers')}
      outstanding={{
        openingRemaining: payable.openingRemaining,
        bills: payable.unpaidPurchases.map((purchase) => ({
          id: purchase.id,
          reference: purchase.purchaseNo,
          date: purchase.purchaseDate,
          totalAmount: purchase.totalAmount,
          paidAmount: purchase.paidAmount,
          remaining: purchase.remaining,
          href: `/dashboard/purchases/${purchase.id}`
        }))
      }}
      outstandingBillKind={t('dukaan.party.outstandingPurchase')}
    />
  );
}
