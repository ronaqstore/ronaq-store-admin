'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { OverdraftAlert } from '@/components/common/overdraft-alert';
import { PartyLedgerView } from '@/components/common/party-ledger-view';
import { useT } from '@/i18n/use-t';
import { formatPkr, toPaisa } from '@/lib/dukaan/numbers';
import { dukaanKeys, supplierQueryOptions } from '@/features/dukaan/api/queries';
import {
  supplierPayableQueryOptions,
  supplierPaymentKeys
} from '@/features/supplier-payments/api/queries';
import { createSupplierPayment } from '@/features/supplier-payments/api/service';
import { todayIsoDate } from '@/lib/dates';
import type { OverdraftPrompt } from '@/types';
import type {
  CreateSupplierPaymentInput,
  CreateSupplierPaymentResult,
  SupplierLedgerPayPlanResult,
  SupplierPayableDTO
} from '@/types/supplier-payment';
import type {
  SupplierLedgerClientProps,
  SupplierLedgerPayArgs,
  SupplierLedgerPendingPay
} from '@/types/suppliers';
import { buildSupplierLedgerPaymentPlan } from '../lib/resolve-supplier-ledger-payments';

async function runSupplierPayPlan(
  supplierId: string,
  amount: number,
  payable: Pick<SupplierPayableDTO, 'openingRemaining' | 'unpaidPurchases'>,
  confirmOverdraft: boolean,
  resumeFrom: number
): Promise<SupplierLedgerPayPlanResult | null> {
  const plan = buildSupplierLedgerPaymentPlan(supplierId, toPaisa(amount), todayIsoDate(), payable);
  if (plan.length === 0) {
    return null;
  }

  let last: CreateSupplierPaymentResult | undefined;

  for (let i = resumeFrom; i < plan.length; i++) {
    const step: CreateSupplierPaymentInput = {
      ...plan[i],
      confirmOverdraft: confirmOverdraft ? true : undefined
    };
    last = await createSupplierPayment(step);
    if ('confirmOverdraft' in last && last.confirmOverdraft) {
      return { ...last, resumeFrom: i, amount };
    }
  }

  return last ?? null;
}

export function SupplierLedgerClient({ id }: SupplierLedgerClientProps) {
  const qc = useQueryClient();
  const t = useT();
  const { data } = useSuspenseQuery(supplierQueryOptions(id));
  const { data: payable } = useSuspenseQuery(supplierPayableQueryOptions(id));
  const [overdraftPrompt, setOverdraftPrompt] = useState<OverdraftPrompt | null>(null);
  const [confirmOverdraft, setConfirmOverdraft] = useState(false);
  const [pendingPay, setPendingPay] = useState<SupplierLedgerPendingPay | null>(null);

  const clearOverdraft = () => {
    setOverdraftPrompt(null);
    setConfirmOverdraft(false);
    setPendingPay(null);
  };

  const pay = useMutation({
    mutationFn: async ({ amount, confirmOverdraft: confirm, resumeFrom = 0 }: SupplierLedgerPayArgs) =>
      runSupplierPayPlan(id, amount, payable, !!confirm, resumeFrom),
    onSuccess: (res) => {
      if (!res) {
        toast.error(t('dukaan.party.paymentRecorded'));
        return;
      }
      if ('confirmOverdraft' in res && res.confirmOverdraft) {
        const resumeFrom = res.resumeFrom ?? 0;
        const amount = res.amount ?? pendingPay?.amount ?? 0;
        setPendingPay({ amount, resumeFrom });
        setOverdraftPrompt({
          shortfall: res.shortfall,
          message: res.message
        });
        setConfirmOverdraft(false);
        toast.warning(
          res.message ||
            t('purchases.overdraftPrompt', {
              shortfall: formatPkr(res.shortfall ?? 0)
            })
        );
        return;
      }

      clearOverdraft();
      toast.success(t('dukaan.party.paymentRecorded'));
      void qc.invalidateQueries({ queryKey: dukaanKeys.supplier(id) });
      void qc.invalidateQueries({ queryKey: supplierPaymentKeys.payable(id) });
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(message);
    }
  });

  const handlePay = async (amount: number) => {
    clearOverdraft();
    await pay.mutateAsync({ amount });
  };

  const handleConfirmOverdraft = async () => {
    if (!pendingPay || !confirmOverdraft) {
      toast.error(t('purchases.cancelDialog.confirmOverdraftRequired'));
      return;
    }
    await pay.mutateAsync({
      amount: pendingPay.amount,
      confirmOverdraft: true,
      resumeFrom: pendingPay.resumeFrom
    });
  };

  return (
    <div className='space-y-4'>
      {overdraftPrompt ? (
        <div className='mx-auto w-full min-w-0 max-w-5xl space-y-3'>
          <OverdraftAlert
            checked={confirmOverdraft}
            onCheckedChange={setConfirmOverdraft}
            title={t('purchases.cancelDialog.overdraftWarning')}
            description={
              overdraftPrompt.message ||
              t('purchases.overdraftPrompt', {
                shortfall: formatPkr(overdraftPrompt.shortfall ?? 0)
              })
            }
            confirmLabel={t('purchases.cancelDialog.confirmOverdraft')}
            id='supplier-ledger-overdraft'
          />
          <button
            type='button'
            className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium disabled:opacity-50'
            disabled={!confirmOverdraft || pay.isPending}
            onClick={() => void handleConfirmOverdraft()}
          >
            {t('purchases.cancelDialog.confirmOverdraft')}
          </button>
        </div>
      ) : null}

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
        onPay={handlePay}
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
    </div>
  );
}
