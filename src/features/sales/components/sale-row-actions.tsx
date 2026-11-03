'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Icons } from '@/components/icons';
import { RowActionsMenu } from '@/components/common/row-actions-menu';
import type { RowAction } from '@/types/dukaan';
import type { SaleRowActionsProps } from '@/types/sales';
import { buildSaleReceiptData } from '../helpers/whatsapp-receipt-formatter';

const CancelSaleDialog = dynamic(
  () => import('./cancel-sale-dialog').then((m) => m.CancelSaleDialog),
  { loading: () => null }
);
const ReturnSaleDialog = dynamic(
  () => import('./return-sale-dialog').then((m) => m.ReturnSaleDialog),
  { loading: () => null }
);
const SaleWhatsAppShareDialog = dynamic(
  () => import('./sale-whatsapp-share-dialog').then((m) => m.SaleWhatsAppShareDialog),
  { loading: () => null }
);

export function SaleRowActions({ sale }: SaleRowActionsProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);

  const actions: RowAction[] = [
    {
      label: 'View',
      icon: Icons.eye,
      onClick: () => window.location.assign(`/dashboard/sales/${sale.id}`)
    },
    {
      label: 'WhatsApp',
      icon: Icons.chat,
      onClick: () => setWhatsAppOpen(true)
    },
    ...(sale.status === 'ACTIVE'
      ? ([
          {
            label: 'Return',
            icon: Icons.chevronLeft,
            onClick: () => setReturnOpen(true)
          },
          {
            label: 'Cancel',
            icon: Icons.close,
            variant: 'destructive',
            onClick: () => setCancelOpen(true)
          }
        ] satisfies RowAction[])
      : [])
  ];

  return (
    <div onClick={(e) => e.stopPropagation()} data-slot='action-cell'>
      {cancelOpen && (
        <CancelSaleDialog sale={sale} open={cancelOpen} onOpenChange={setCancelOpen} />
      )}
      {returnOpen && (
        <ReturnSaleDialog sale={sale} open={returnOpen} onOpenChange={setReturnOpen} />
      )}
      {whatsAppOpen && (
        <SaleWhatsAppShareDialog
          open={whatsAppOpen}
          onOpenChange={setWhatsAppOpen}
          receiptData={buildSaleReceiptData(sale)}
        />
      )}

      <RowActionsMenu actions={actions} />
    </div>
  );
}
