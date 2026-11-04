import type { DetailConfig } from '@/components/data-table';
import { formatPkr } from '@/lib/dukaan/numbers';
import type { ConsignmentDTO } from '@/lib/api/types';
import type { BuildConsignmentDetailOptions } from '@/types/consignments';

export function buildConsignmentDetail({
  t,
  onPrintIntakeSlip,
  onPrintSettlementSlip,
  onSettle,
  onReturn,
  onCancel
}: BuildConsignmentDetailOptions): DetailConfig<ConsignmentDTO> {
  return {
    mode: 'sheet',
    title: (row) => `${row.consignmentNo} • ${row.productName}`,
    badge: (row) => ({
      label: t(
        `consignments.status${row.status === 'IN_CUSTODY' ? 'InCustody' : row.status === 'SOLD' ? 'Sold' : row.status === 'SETTLED' ? 'Settled' : row.status === 'RETURNED_TO_OWNER' ? 'Returned' : 'Cancelled'}`
      ),
      tone: row.status === 'SETTLED' ? 'success' : row.status === 'CANCELLED' ? 'danger' : 'warning'
    }),
    value: (row) => formatPkr(row.agreedPayout),
    sections: (row) => [
      {
        title: t('consignments.deviceDetails'),
        fields: [
          { label: t('table.col.name'), value: row.productName },
          { label: t('inventory.imeiLabel'), value: row.imei1 },
          ...(row.imei2 ? [{ label: t('inventory.imei2Label'), value: row.imei2 }] : []),
          {
            label: t('consignments.condition'),
            value:
              row.condition === 'NEW'
                ? t('consignments.conditionNew')
                : t('consignments.conditionUsed')
          },
          ...(row.batteryHealth != null
            ? [{ label: t('consignments.batteryHealth'), value: `${row.batteryHealth}%` }]
            : []),
          ...(row.defectNotes
            ? [{ label: t('consignments.defectNotes'), value: row.defectNotes }]
            : [])
        ]
      },
      {
        title: t('consignments.consignorDetails'),
        fields: [
          { label: t('consignments.consignorName'), value: row.consignorName },
          { label: t('consignments.consignorPhone'), value: row.consignorPhone },
          ...(row.consignorCnic
            ? [{ label: t('consignments.consignorCnic'), value: row.consignorCnic }]
            : [])
        ]
      },
      {
        title: t('consignments.financialDetails'),
        fields: [
          { label: t('consignments.agreedPayout'), value: formatPkr(row.agreedPayout) },
          ...(row.targetSellingPrice != null
            ? [
                {
                  label: t('consignments.targetAsking'),
                  value: formatPkr(row.targetSellingPrice)
                }
              ]
            : []),
          ...(row.soldPrice != null
            ? [{ label: t('consignments.soldPrice'), value: formatPkr(row.soldPrice) }]
            : []),
          ...(row.settledAmount != null
            ? [{ label: t('consignments.settledAmount'), value: formatPkr(row.settledAmount) }]
            : [])
        ]
      }
    ],
    actions: (row) => [
      {
        label: t('consignments.printIntakeSlip'),
        onClick: () => onPrintIntakeSlip(row)
      },
      ...(row.status === 'SETTLED'
        ? [
            {
              label: t('consignments.printSettlementSlip'),
              onClick: () => onPrintSettlementSlip(row)
            }
          ]
        : []),
      ...(row.status === 'SOLD'
        ? [
            {
              label: t('consignments.settlePayoutAction'),
              onClick: () => onSettle(row)
            }
          ]
        : []),
      ...(row.status === 'IN_CUSTODY'
        ? [
            {
              label: t('consignments.returnAction'),
              variant: 'secondary' as const,
              onClick: () => onReturn(row)
            },
            {
              label: t('common.cancel'),
              variant: 'destructive' as const,
              onClick: () => onCancel(row)
            }
          ]
        : [])
    ]
  };
}
