'use client';

import { RowActionsMenu } from '@/components/common/row-actions-menu';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import type { ConsignmentRowActionsProps } from '@/types/consignments';

export function ConsignmentRowActions({
  consignment,
  onPrintIntakeSlip,
  onPrintSettlementSlip,
  onWhatsAppShare,
  onReturn,
  onSettle,
  onCancel
}: ConsignmentRowActionsProps) {
  const t = useT();

  const actions = [
    {
      label: t('consignments.printIntakeSlip'),
      icon: Icons.print,
      onClick: () => onPrintIntakeSlip(consignment)
    },
    ...(onWhatsAppShare
      ? [
          {
            label: t('consignments.whatsappSlip'),
            icon: Icons.chat,
            onClick: () =>
              onWhatsAppShare(
                consignment,
                consignment.status === 'SETTLED' ? 'settlement' : 'intake'
              )
          }
        ]
      : []),
    ...(consignment.status === 'SETTLED'
      ? [
          {
            label: t('consignments.printSettlementSlip'),
            icon: Icons.receipt,
            onClick: () => onPrintSettlementSlip(consignment)
          }
        ]
      : []),
    ...(consignment.status === 'SOLD'
      ? [
          {
            label: t('consignments.settlePayoutAction'),
            icon: Icons.cash,
            onClick: () => onSettle(consignment)
          }
        ]
      : []),
    ...(consignment.status === 'IN_CUSTODY'
      ? [
          {
            label: t('consignments.returnAction'),
            icon: Icons.history,
            onClick: () => onReturn(consignment)
          },
          {
            label: t('common.cancel'),
            icon: Icons.close,
            variant: 'destructive' as const,
            onClick: () => onCancel(consignment)
          }
        ]
      : [])
  ];

  return (
    <div className='flex justify-end'>
      <RowActionsMenu actions={actions} />
    </div>
  );
}
