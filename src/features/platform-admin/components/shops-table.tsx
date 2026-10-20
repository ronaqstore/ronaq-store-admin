'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import {
  ResponsiveDataTable,
  type DetailConfig,
  type MobileItemConfig,
  type QuickFilterChip
} from '@/components/data-table';
import {
  DUKAAN_DEFAULT_PAGE_SIZE,
  useDukaanListParams
} from '@/components/data-table/list-params';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { useDataTable } from '@/hooks/use-data-table';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import { t as staticT } from '@/i18n/static-t';
import { RowActionsMenu } from '@/components/common/row-actions-menu';
import { AlertModal } from '@/components/modal/alert-modal';
import { formatIsoDate } from '@/lib/dates';
import type {
  PlatformShop,
  PlatformShopAccessStatus,
  ShopRowActionsProps
} from '../api/types';
import { platformKeys, platformShopsQueryOptions } from '../api/queries';
import { updateShopSubscription } from '../api/service';
import {
  PLATFORM_ACCESS_STATUS_LABEL_KEY,
  PLATFORM_ACCESS_STATUS_VALUES,
  platformAccessStatusOptions
} from '../constants/filters';
import { ShopStatusBadge } from './shop-status-badge';
import { RenewSubscriptionDialog } from './renew-subscription-dialog';

const SORTABLE_COLUMN_IDS = ['name', 'createdAt', 'subscriptionEndsAt'] as const;

const columns: ColumnDef<PlatformShop>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={staticT('table.shopName')} />
    ),
    cell: ({ row }) => (
      <div className='min-w-40'>
        <p className='font-medium'>{row.original.name}</p>
        <p className='text-muted-foreground text-xs'>
          {row.original.address || row.original.storeSlug || '—'}
        </p>
      </div>
    ),
    meta: {
      label: 'table.shopName',
      placeholderKey: 'nav.searchShops',
      variant: 'text',
      icon: Icons.search,
      type: 'text',
      primary: true,
      priority: 1
    },
    enableColumnFilter: true,
    enableSorting: true
  },
  {
    id: 'ownerName',
    accessorKey: 'ownerName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={staticT('table.ownerName')} />
    ),
    cell: ({ row }) => (
      <div>
        <p className='font-medium'>{row.original.ownerName ?? '—'}</p>
        <p className='text-muted-foreground text-xs'>{row.original.ownerPhone ?? '—'}</p>
      </div>
    ),
    meta: { label: 'table.ownerName', type: 'text', priority: 2 },
    enableSorting: false
  },
  {
    id: 'accessStatus',
    accessorKey: 'accessStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={staticT('table.col.status')} />
    ),
    cell: ({ row }) => <ShopStatusBadge status={row.original.accessStatus} />,
    meta: {
      label: 'platform.allStatuses',
      variant: 'multiSelect',
      icon: Icons.building,
      options: platformAccessStatusOptions,
      type: 'status',
      priority: 1
    },
    enableColumnFilter: true,
    enableSorting: false
  },
  {
    id: 'subscriptionEndsAt',
    accessorKey: 'subscriptionEndsAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={staticT('platform.subscriptionEnds')} />
    ),
    cell: ({ row }) => formatIsoDate(row.original.subscriptionEndsAt),
    meta: {
      label: 'platform.subscriptionEnds',
      type: 'date',
      highlight: true,
      priority: 1
    },
    enableSorting: true
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={staticT('platform.createdAt')} />
    ),
    cell: ({ row }) => formatIsoDate(row.original.createdAt),
    meta: {
      label: 'platform.createdAt',
      type: 'date',
      priority: 3
    },
    enableSorting: true
  },
  {
    id: 'actions',
    meta: { mobile: 'hidden' },
    cell: ({ row }) => <ShopRowActions shop={row.original} />,
    enableSorting: false
  }
];

function statusLabel(status: PlatformShopAccessStatus): string {
  return staticT(PLATFORM_ACCESS_STATUS_LABEL_KEY[status]);
}

function ShopRowActions({ shop }: ShopRowActionsProps) {
  const t = useT();
  const qc = useQueryClient();
  const [renewOpen, setRenewOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);

  const suspend = useMutation({
    mutationFn: () => updateShopSubscription(shop.id, { isActive: false }),
    onSuccess: () => {
      setSuspendOpen(false);
      void qc.invalidateQueries({ queryKey: platformKeys.all });
      toastSuccessAfterClose(t('platform.suspendSuccess', { name: shop.name }));
    },
    onError: (err: Error) => toast.error(err.message || t('platform.suspendFailed'))
  });

  const reactivate = useMutation({
    mutationFn: () => updateShopSubscription(shop.id, { isActive: true }),
    onSuccess: () => {
      setReactivateOpen(false);
      void qc.invalidateQueries({ queryKey: platformKeys.all });
      toastSuccessAfterClose(t('platform.reactivateSuccess', { name: shop.name }));
    },
    onError: (err: Error) => toast.error(err.message || t('platform.reactivateFailed'))
  });

  const busy = suspend.isPending || reactivate.isPending;

  return (
    <>
      <AlertModal
        isOpen={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={() => suspend.mutate()}
        loading={suspend.isPending}
        title={t('platform.suspendTitle')}
        description={t('platform.suspendDescription', { name: shop.name })}
        confirmLabel={t('platform.suspendAction')}
      />
      <AlertModal
        isOpen={reactivateOpen}
        onClose={() => setReactivateOpen(false)}
        onConfirm={() => reactivate.mutate()}
        loading={reactivate.isPending}
        title={t('platform.reactivateTitle')}
        description={t('platform.reactivateDescription', { name: shop.name })}
        confirmLabel={t('platform.reactivateAction')}
        confirmVariant='default'
      />
      <RowActionsMenu
        actions={[
          {
            label: t('platform.renewAction'),
            onClick: () => setRenewOpen(true),
            disabled: busy
          },
          shop.status === 'SUSPENDED'
            ? {
                label: t('platform.reactivateAction'),
                onClick: () => setReactivateOpen(true),
                disabled: busy
              }
            : {
                label: t('platform.suspendAction'),
                onClick: () => setSuspendOpen(true),
                disabled: busy
              }
        ]}
      />
      <RenewSubscriptionDialog
        open={renewOpen}
        onOpenChange={setRenewOpen}
        shopId={shop.id}
        shopName={shop.name}
        currentEndsAt={shop.subscriptionEndsAt}
      />
    </>
  );
}

const shopMobileItem: MobileItemConfig<PlatformShop> = {
  leading: 'avatar',
  title: (row) => row.name,
  subtitle: (row) => `${row.ownerName ?? '—'} · ${row.ownerPhone ?? '—'}`,
  badge: (row) => ({
    label: statusLabel(row.accessStatus),
    status: row.accessStatus
  }),
  value: (row) => formatIsoDate(row.subscriptionEndsAt),
  valueLabel: () => staticT('platform.subscriptionEnds'),
  meta: [
    (row) => (row.hasPassword ? staticT('platform.passwordSet') : staticT('platform.passwordPending'))
  ],
  ariaLabel: (row) =>
    `${row.name}, ${row.ownerName ?? ''}, ${statusLabel(row.accessStatus)}`
};

const shopDetail: DetailConfig<PlatformShop> = {
  mode: 'sheet',
  title: (row) => row.name,
  badge: (row) => ({
    label: statusLabel(row.accessStatus),
    status: row.accessStatus
  }),
  value: (row) => formatIsoDate(row.subscriptionEndsAt),
  sections: (row) => [
    {
      title: staticT('platform.shop'),
      fields: [
        { label: staticT('table.col.name'), value: row.name },
        { label: staticT('table.address'), value: row.address ?? '—' },
        { label: staticT('platform.storeSlug'), value: row.storeSlug ?? '—' },
        { label: staticT('table.col.status'), value: <ShopStatusBadge status={row.accessStatus} /> }
      ]
    },
    {
      title: staticT('platform.owner'),
      fields: [
        { label: staticT('table.col.name'), value: row.ownerName ?? '—' },
        {
          label: staticT('table.col.phone'),
          value: row.ownerPhone ? (
            <a
              className='text-primary underline-offset-2 hover:underline'
              href={`tel:${row.ownerPhone}`}
            >
              {row.ownerPhone}
            </a>
          ) : (
            '—'
          )
        },
        {
          label: staticT('platform.password'),
          value: row.hasPassword
            ? staticT('platform.passwordSet')
            : staticT('platform.passwordPending')
        }
      ]
    },
    {
      title: staticT('platform.subscription'),
      fields: [
        {
          label: staticT('platform.subscriptionEnds'),
          value: formatIsoDate(row.subscriptionEndsAt)
        },
        {
          label: staticT('platform.createdAt'),
          value: formatIsoDate(row.createdAt)
        }
      ]
    }
  ]
};

export function PlatformShopsTable() {
  const t = useT();

  const { params, filters, sortBy, sortOrder, getPageCount } = useDukaanListParams<
    (typeof SORTABLE_COLUMN_IDS)[number]
  >([...SORTABLE_COLUMN_IDS], 'name', ['accessStatus'], 'createdAt', 'desc');

  const accessStatusRaw = (filters as Record<string, string | undefined>).accessStatus;
  const accessStatusFilter =
    typeof accessStatusRaw === 'string' && accessStatusRaw.length > 0
      ? accessStatusRaw
      : undefined;

  const { data, isFetching } = useQuery(
    platformShopsQueryOptions({
      page: params.page,
      pageSize: params.perPage,
      search: filters.search,
      accessStatus: accessStatusFilter,
      sortBy,
      sortOrder
    })
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = getPageCount(total);

  const { table } = useDataTable({
    data: items,
    columns,
    pageCount,
    rowCount: total,
    shallow: true,
    debounceMs: 400,
    initialState: {
      pagination: { pageIndex: 0, pageSize: DUKAAN_DEFAULT_PAGE_SIZE },
      columnPinning: { right: ['actions'] },
      sorting: [{ id: 'createdAt', desc: true }]
    }
  });

  const shopQuickFilters: QuickFilterChip[] = [
    { id: 'all', label: t('table.all') },
    ...PLATFORM_ACCESS_STATUS_VALUES.map((value) => ({
      id: value,
      label: t(PLATFORM_ACCESS_STATUS_LABEL_KEY[value]),
      columnId: 'accessStatus',
      value: [value]
    }))
  ];

  return (
    <ResponsiveDataTable
      table={table}
      mobileItem={shopMobileItem}
      detail={shopDetail}
      quickFilters={shopQuickFilters}
      isLoading={isFetching}
    />
  );
}
