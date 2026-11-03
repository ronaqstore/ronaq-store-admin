'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { parseAsString, useQueryState } from 'nuqs';
import { ResponsiveDataTable, type MobileItemConfig } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { RowActionsMenu } from '@/components/common/row-actions-menu';
import { Icons } from '@/components/icons';
import { useDataTable } from '@/hooks/use-data-table';
import { useT } from '@/i18n/use-t';
import { formatIsoDate } from '@/lib/dates';
import { formatPkr } from '@/lib/dukaan/numbers';
import type { ConsignmentDTO } from '@/lib/api/types';
import type {
  ConsignmentRowActionsProps,
  ConsignmentSlipModalState,
  ConsignmentsTableProps
} from '@/types/consignments';
import { consignmentsQueryOptions } from '../api/queries';
import { ConsignmentStatusBadge } from './consignment-status-badge';
import { ConsignmentIntakeDialog } from './consignment-intake-dialog';
import { ReturnConsignmentDialog } from './return-consignment-dialog';
import { SettleConsignmentDialog } from './settle-consignment-dialog';
import { CancelConsignmentDialog } from './cancel-consignment-dialog';
import { ConsignmentSlipDialog } from './consignment-slip-dialog';

function ConsignmentRowActions({
  consignment,
  onPrintIntakeSlip,
  onPrintSettlementSlip,
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
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role='presentation'
      data-slot='action-cell'
    >
      <RowActionsMenu actions={actions} />
    </div>
  );
}

export function ConsignmentsTable({ toolbarAction, onOpenAdd }: ConsignmentsTableProps) {
  const t = useT();

  const [searchParam] = useQueryState('search', parseAsString);
  const [statusParam] = useQueryState('status', parseAsString);
  const [pageParam] = useQueryState('page', parseAsString);
  const [pageSizeParam] = useQueryState('pageSize', parseAsString);

  const page = pageParam ? Number(pageParam) : 1;
  const pageSize = pageSizeParam ? Number(pageSizeParam) : 20;

  const [intakeOpen, setIntakeOpen] = useState(false);
  const [returnConsignment, setReturnConsignment] = useState<ConsignmentDTO | null>(null);
  const [settleConsignment, setSettleConsignment] = useState<ConsignmentDTO | null>(null);
  const [cancelConsignment, setCancelConsignment] = useState<ConsignmentDTO | null>(null);

  const [slipModal, setSlipModal] = useState<ConsignmentSlipModalState>({
    open: false,
    consignment: null,
    type: 'intake'
  });

  const { data, isFetching } = useQuery(
    consignmentsQueryOptions({
      page,
      pageSize,
      search: searchParam || undefined,
      status: statusParam || undefined
    })
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const columns: ColumnDef<ConsignmentDTO>[] = useMemo(
    () => [
      {
        id: 'consignmentNo',
        accessorKey: 'consignmentNo',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('consignments.consignmentNo')} />
        ),
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <span className='font-mono font-semibold text-foreground'>
              {row.original.consignmentNo}
            </span>
            <span className='text-xs text-muted-foreground'>
              {formatIsoDate(row.original.intakeDate)}
            </span>
          </div>
        )
      },
      {
        id: 'device',
        header: t('consignments.device'),
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <span className='font-medium text-foreground'>{row.original.productName}</span>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground font-mono'>
              <span>
                {t('inventory.imeiLabel')} {row.original.imei1}
              </span>
              {row.original.batteryHealth != null && (
                <span className='rounded bg-muted px-1 text-[10px]'>
                  {row.original.batteryHealth}%
                </span>
              )}
            </div>
          </div>
        )
      },
      {
        id: 'consignor',
        header: t('consignments.consignor'),
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <span className='font-medium text-foreground'>{row.original.consignorName}</span>
            <span className='text-xs text-muted-foreground'>{row.original.consignorPhone}</span>
          </div>
        )
      },
      {
        id: 'agreedPayout',
        accessorKey: 'agreedPayout',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('consignments.agreedPayout')} />
        ),
        cell: ({ row }) => (
          <div className='flex flex-col font-medium'>
            <span className='text-foreground'>{formatPkr(row.original.agreedPayout)}</span>
            {row.original.targetSellingPrice != null && (
              <span className='text-xs text-muted-foreground'>
                {t('consignments.targetAsking')}: {formatPkr(row.original.targetSellingPrice)}
              </span>
            )}
          </div>
        )
      },
      {
        id: 'soldPrice',
        header: t('consignments.soldPrice'),
        cell: ({ row }) => {
          if (row.original.soldPrice != null) {
            const effectivePayout =
              row.original.settledAmount != null
                ? row.original.settledAmount
                : row.original.agreedPayout;
            const margin = row.original.soldPrice - effectivePayout;
            return (
              <div className='flex flex-col font-medium'>
                <span className='text-foreground'>{formatPkr(row.original.soldPrice)}</span>
                <span className='text-xs text-emerald-600 dark:text-emerald-400'>
                  +{formatPkr(margin)}
                </span>
              </div>
            );
          }
          return <span className='text-muted-foreground'>—</span>;
        }
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: t('table.col.status'),
        cell: ({ row }) => <ConsignmentStatusBadge status={row.original.status} />
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <ConsignmentRowActions
            consignment={row.original}
            onPrintIntakeSlip={(c) => setSlipModal({ open: true, consignment: c, type: 'intake' })}
            onPrintSettlementSlip={(c) =>
              setSlipModal({ open: true, consignment: c, type: 'settlement' })
            }
            onReturn={setReturnConsignment}
            onSettle={setSettleConsignment}
            onCancel={setCancelConsignment}
          />
        )
      }
    ],
    [t]
  );

  const { table } = useDataTable({
    data: items,
    columns,
    pageCount,
    shallow: false,
    clearOnDefault: true
  });

  const mobileItem: MobileItemConfig<ConsignmentDTO> = useMemo(
    () => ({
      leading: 'icon',
      leadingIcon: Icons.phone,
      title: (row) => `${row.consignmentNo} • ${row.productName}`,
      subtitle: (row) => `${row.consignorName} (${row.consignorPhone})`,
      badge: (row) => ({
        label: t(
          `consignments.status${row.status === 'IN_CUSTODY' ? 'InCustody' : row.status === 'SOLD' ? 'Sold' : row.status === 'SETTLED' ? 'Settled' : row.status === 'RETURNED_TO_OWNER' ? 'Returned' : 'Cancelled'}`
        ),
        tone:
          row.status === 'SETTLED' ? 'success' : row.status === 'CANCELLED' ? 'danger' : 'warning'
      }),
      value: (row) => formatPkr(row.agreedPayout),
      meta: [
        (row) => `${t('inventory.imeiLabel')} ${row.imei1}`,
        (row) => formatIsoDate(row.intakeDate)
      ],
      ariaLabel: (row) => `${row.consignmentNo}, ${row.productName}, ${formatPkr(row.agreedPayout)}`
    }),
    [t]
  );

  return (
    <>
      <ResponsiveDataTable
        table={table}
        mobileItem={mobileItem}
        toolbarAction={toolbarAction}
        isLoading={isFetching}
      />

      <ConsignmentIntakeDialog
        open={intakeOpen}
        onOpenChange={setIntakeOpen}
        onSuccess={(created) => {
          setSlipModal({ open: true, consignment: created, type: 'intake' });
        }}
      />

      <ReturnConsignmentDialog
        consignment={returnConsignment}
        open={!!returnConsignment}
        onOpenChange={(open) => {
          if (!open) setReturnConsignment(null);
        }}
      />

      <SettleConsignmentDialog
        consignment={settleConsignment}
        open={!!settleConsignment}
        onOpenChange={(open) => {
          if (!open) setSettleConsignment(null);
        }}
        onSuccess={(settled) => {
          setSlipModal({ open: true, consignment: settled, type: 'settlement' });
        }}
      />

      <CancelConsignmentDialog
        consignment={cancelConsignment}
        open={!!cancelConsignment}
        onOpenChange={(open) => {
          if (!open) setCancelConsignment(null);
        }}
      />

      <ConsignmentSlipDialog
        consignment={slipModal.consignment}
        type={slipModal.type}
        open={slipModal.open}
        onOpenChange={(open) => setSlipModal((prev) => ({ ...prev, open }))}
      />
    </>
  );
}
