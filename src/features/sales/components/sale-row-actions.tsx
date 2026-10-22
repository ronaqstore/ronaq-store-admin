'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Icons } from '@/components/icons';
import { RowActionsMenu } from '@/components/common/row-actions-menu';
import type { RowAction } from '@/types/dukaan';
import type { SaleRowActionsProps } from '@/types/sales';

const CancelSaleDialog = dynamic(
  () => import('./cancel-sale-dialog').then((m) => m.CancelSaleDialog),
  { loading: () => null }
);
const ReturnSaleDialog = dynamic(
  () => import('./return-sale-dialog').then((m) => m.ReturnSaleDialog),
  { loading: () => null }
);

export function SaleRowActions({ sale }: SaleRowActionsProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const actions: RowAction[] = [
    {
      label: 'View',
      icon: Icons.eye,
      onClick: () => window.location.assign(`/dashboard/sales/${sale.id}`)
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

      <RowActionsMenu actions={actions} />
    </div>
  );
}
