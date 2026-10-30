'use client';

import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { FloatingActionButton } from '@/components/common/floating-action-button';
import { PartyLedgerView } from '@/components/common/party-ledger-view';
import { TablePageBody } from '@/components/layout/table-page-body';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/use-t';
import { createClientRequestId, toPaisa } from '@/lib/dukaan/numbers';
import { customerQueryOptions, dukaanKeys } from '@/features/dukaan/api/queries';
import {
  customerReceivableQueryOptions,
  paymentKeys
} from '@/features/payments/api/queries';
import { createPayment } from '@/features/payments/api/service';
import { todayIsoDate } from '@/lib/dates';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { PAYMENT_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import { CustomerDialog } from './customer-dialog';
import { CustomersTable } from './customers-table';
import type { CustomersHeaderActionProps, CustomerLedgerClientProps } from '@/types';

export function CustomersHeaderAction({ onAdd }: CustomersHeaderActionProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    if (onAdd) onAdd();
    else setOpen(true);
  };
  return (
    <>
      <Button type='button' size='sm' onClick={handleOpen}>
        <Icons.add className='me-2 h-4 w-4' />
        {t('common.addCustomer')}
      </Button>
      {onAdd ? null : <CustomerDialog open={open} onOpenChange={setOpen} />}
    </>
  );
}

export function CustomersListClient() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <TablePageBody>
      <CustomersTable toolbarAction={<CustomersHeaderAction onAdd={() => setOpen(true)} />} />
      <FloatingActionButton label={t('common.addCustomer')} onClick={() => setOpen(true)} />
      <CustomerDialog open={open} onOpenChange={setOpen} />
    </TablePageBody>
  );
}

export function CustomerLedgerClient({ id }: CustomerLedgerClientProps) {
  const qc = useQueryClient();
  const t = useT();
  const { data } = useSuspenseQuery(customerQueryOptions(id));
  const { data: receivable } = useSuspenseQuery(customerReceivableQueryOptions(id));
  const [clientRequestId, setClientRequestId] = useState(() => createClientRequestId());

  const pay = useMutation({
    mutationFn: (amount: number) =>
      createPayment({
        customerId: id,
        amount: toPaisa(amount),
        clientRequestId,
        paymentDate: todayIsoDate()
      }),
    onSuccess: () => {
      toast.success(t('dukaan.party.paymentRecorded'));
      setClientRequestId(createClientRequestId());
      void qc.invalidateQueries({ queryKey: dukaanKeys.customer(id) });
      void qc.invalidateQueries({ queryKey: paymentKeys.receivable(id) });
      invalidateDomains({ queryClient: qc, domains: PAYMENT_SYNC_DOMAINS });
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
      currentBalance={data.udhar}
      openingBalanceLabel={t('dukaan.party.customerOpeningBalance')}
      currentBalanceLabel={t('dukaan.party.currentUdhar')}
      paymentLabel={t('dukaan.party.receivePayment')}
      isPaying={pay.isPending}
      onPay={(amount) => pay.mutateAsync(amount)}
      ledger={data.ledger}
      backHref='/dashboard/customers'
      backLabel={t('dukaan.party.backToCustomers')}
      outstanding={{
        openingRemaining: receivable.openingRemaining,
        bills: receivable.unpaidSales.map((sale) => ({
          id: sale.id,
          reference: sale.saleNo,
          date: sale.saleDate,
          totalAmount: sale.totalAmount,
          paidAmount: sale.paidAmount,
          remaining: sale.remaining,
          href: `/dashboard/sales/${sale.id}`
        }))
      }}
      outstandingBillKind={t('dukaan.party.outstandingSale')}
    />
  );
}
