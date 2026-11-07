'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';
import {
  ResponsiveDataTable,
  type DetailConfig,
  type MobileItemConfig
} from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import { useDataTable } from '@/hooks/use-data-table';
import { useT } from '@/i18n/use-t';
import { formatIsoDate } from '@/lib/dates';
import { formatPkr } from '@/lib/dukaan/numbers';
import { firstFilterValue, parseFacetDateRange } from '@/lib/dukaan/money-range-filter';
import { customerAsyncFilter } from '@/components/common/customer-filter';
import { useDukaanListParams } from '@/components/data-table/list-params';
import type { ConsignmentDTO } from '@/lib/api/types';
import type {
  ConsignmentSlipModalState,
  ConsignmentWhatsAppModalState,
  ConsignmentsTableProps
} from '@/types/consignments';
import { consignmentsQueryOptions } from '../api/queries';
import { ConsignmentStatusBadge } from './consignment-status-badge';
import { ConsignmentRowActions } from './consignment-row-actions';
import { ConsignmentIntakeDialog } from './consignment-intake-dialog';
import { ReturnConsignmentDialog } from './return-consignment-dialog';
import { SettleConsignmentDialog } from './settle-consignment-dialog';
import { CancelConsignmentDialog } from './cancel-consignment-dialog';
import { ConsignmentSlipDialog } from './consignment-slip-dialog';
import { ConsignmentWhatsAppShareDialog } from './consignment-whatsapp-share-dialog';
import { getConsignmentQuickFilters } from './consignments-table-filters';
import { buildConsignmentDetail } from './consignment-table-detail';

export function ConsignmentsTable({ toolbarAction }: ConsignmentsTableProps) {
  const t = useT();

  const sortableColumnIds = ['consignmentNo', 'intakeDate', 'agreedPayout'];
  const { params, filters, sortBy, sortOrder, getPageCount } = useDukaanListParams<
    'intakeDate' | 'consignmentNo'
  >(
    sortableColumnIds,
    'consignmentNo',
    ['status', 'customerId', 'intakeDate'],
    'intakeDate',
    'desc'
  );

  const [consignmentNoParam] = useQueryState('consignmentNo', parseAsString);
  const [searchParam] = useQueryState('search', parseAsString);
  const [statusParam] = useQueryState('status', parseAsString);
  const [customerIdParam] = useQueryState('customerId', parseAsString);
  const [intakeDateParam] = useQueryState('intakeDate', parseAsArrayOf(parseAsString, ','));

  const search = searchParam || consignmentNoParam || undefined;
  const rawStatus =
    ((filters as Record<string, unknown>).status as string | undefined) ?? statusParam ?? undefined;
  const statusClean = firstFilterValue(rawStatus);
  const status = statusClean === 'all' ? undefined : statusClean;
  const customerId =
    firstFilterValue((filters as Record<string, unknown>).customerId) ??
    firstFilterValue(customerIdParam) ??
    undefined;
  const dateRaw = (filters as Record<string, unknown>).intakeDate ?? intakeDateParam;
  const { from: fromDate, to: toDate } = parseFacetDateRange(dateRaw);

  const [intakeOpen, setIntakeOpen] = useState(false);
  const [returnConsignment, setReturnConsignment] = useState<ConsignmentDTO | null>(null);
  const [settleConsignment, setSettleConsignment] = useState<ConsignmentDTO | null>(null);
  const [cancelConsignment, setCancelConsignment] = useState<ConsignmentDTO | null>(null);

  const [slipModal, setSlipModal] = useState<ConsignmentSlipModalState>({
    open: false,
    consignment: null,
    type: 'intake'
  });

  const [waModal, setWaModal] = useState<ConsignmentWhatsAppModalState>({
    open: false,
    consignment: null,
    type: 'intake'
  });

  const { data, isFetching } = useQuery(
    consignmentsQueryOptions({
      page: params.page,
      pageSize: params.perPage,
      search,
      status: status || undefined,
      customerId,
      fromDate,
      toDate,
      sortOrder
    })
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = getPageCount(total);

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
        ),
        meta: {
          label: 'consignments.consignmentNo',
          placeholderKey: 'search.consignments',
          variant: 'text',
          icon: Icons.search,
          primary: true,
          priority: 1,
          mobile: 'title'
        },
        enableColumnFilter: true,
        enableSorting: true
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
        ),
        meta: {
          priority: 2
        }
      },
      {
        id: 'customerId',
        accessorKey: 'customerId',
        accessorFn: (row) => row.customerId ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('consignments.consignor')} />
        ),
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <span className='font-medium text-foreground'>{row.original.consignorName}</span>
            <span className='text-xs text-muted-foreground'>{row.original.consignorPhone}</span>
          </div>
        ),
        meta: {
          label: 'table.col.customer',
          variant: 'select',
          icon: Icons.user,
          asyncOptions: customerAsyncFilter,
          priority: 2,
          mobile: 'subtitle'
        },
        enableColumnFilter: true,
        enableSorting: false
      },
      {
        id: 'intakeDate',
        accessorKey: 'intakeDate',
        accessorFn: (row) => row.intakeDate,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('consignments.intakeDate')} />
        ),
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {formatIsoDate(row.original.intakeDate)}
          </span>
        ),
        meta: {
          label: 'consignments.intakeDate',
          variant: 'dateRange',
          icon: Icons.calendar,
          priority: 3,
          mobile: 'meta'
        },
        enableColumnFilter: true,
        enableSorting: true
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
        ),
        meta: {
          priority: 2,
          mobile: 'value'
        }
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
        },
        meta: {
          priority: 3
        }
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('table.col.status')} />
        ),
        cell: ({ row }) => <ConsignmentStatusBadge status={row.original.status} />,
        meta: {
          label: 'table.col.status',
          variant: 'select',
          icon: Icons.status,
          type: 'status',
          options: (translate) => [
            { label: translate('consignments.statusInCustody'), value: 'IN_CUSTODY' },
            { label: translate('consignments.statusSold'), value: 'SOLD' },
            { label: translate('consignments.statusSettled'), value: 'SETTLED' },
            { label: translate('consignments.statusReturned'), value: 'RETURNED_TO_OWNER' },
            { label: translate('consignments.statusCancelled'), value: 'CANCELLED' }
          ],
          priority: 1,
          mobile: 'badge'
        },
        enableColumnFilter: true
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
            onWhatsAppShare={(c, type) =>
              setWaModal({ open: true, consignment: c, type: type ?? 'intake' })
            }
            onReturn={setReturnConsignment}
            onSettle={setSettleConsignment}
            onCancel={setCancelConsignment}
          />
        )
      }
    ],
    [t, setSlipModal, setWaModal, setReturnConsignment, setSettleConsignment, setCancelConsignment]
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
      stockBadge: (row) => ({
        label: t(
          `consignments.status${row.status === 'IN_CUSTODY' ? 'InCustody' : row.status === 'SOLD' ? 'Sold' : row.status === 'SETTLED' ? 'Settled' : row.status === 'RETURNED_TO_OWNER' ? 'Returned' : 'Cancelled'}`
        ),
        tone:
          row.status === 'SETTLED' ? 'success' : row.status === 'CANCELLED' ? 'danger' : 'warning'
      }),
      chips: (row) =>
        [
          row.consignorName,
          row.imei1 ? `IMEI: ...${row.imei1.slice(-4)}` : null,
          formatIsoDate(row.intakeDate)
        ].filter(Boolean) as string[],
      value: (row) => formatPkr(row.agreedPayout),
      valueLabel: 'Payout',
      secondaryValue: (row) =>
        row.targetSellingPrice ? `Target: ${formatPkr(row.targetSellingPrice)}` : null,
      meta: [
        (row) => `${t('inventory.imeiLabel')} ${row.imei1}`,
        (row) => formatIsoDate(row.intakeDate)
      ],
      ariaLabel: (row) => `${row.consignmentNo}, ${row.productName}, ${formatPkr(row.agreedPayout)}`
    }),
    [t]
  );

  const consignmentDetail: DetailConfig<ConsignmentDTO> = useMemo(
    () =>
      buildConsignmentDetail({
        t,
        onPrintIntakeSlip: (consignment) =>
          setSlipModal({ open: true, consignment, type: 'intake' }),
        onPrintSettlementSlip: (consignment) =>
          setSlipModal({ open: true, consignment, type: 'settlement' }),
        onSettle: setSettleConsignment,
        onReturn: setReturnConsignment,
        onCancel: setCancelConsignment
      }),
    [t, setSlipModal, setSettleConsignment, setReturnConsignment, setCancelConsignment]
  );

  const quickFilters = useMemo(() => getConsignmentQuickFilters(t), [t]);

  return (
    <>
      <ResponsiveDataTable
        table={table}
        mobileItem={mobileItem}
        detail={consignmentDetail}
        quickFilters={quickFilters}
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

      <ConsignmentWhatsAppShareDialog
        open={waModal.open}
        onOpenChange={(open) => setWaModal((prev) => ({ ...prev, open }))}
        consignment={waModal.consignment}
        type={waModal.type}
      />
    </>
  );
}
