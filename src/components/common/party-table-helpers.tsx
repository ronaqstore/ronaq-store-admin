'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import {
  StatusBadge,
  type DetailAction,
  type DetailConfig,
  type MobileItemConfig,
  type QuickFilterChip
} from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { formatPkr } from '@/lib/dukaan/numbers';
import { formatDate } from '@/lib/format';
import { formatPkMobileLocal } from '@/lib/auth/phone';
import { t } from '@/i18n';
import type {
  BasePartyRecord,
  PartyBalanceColumnOptions,
  PartyDetailLabels,
  PartyNameColumnOptions,
  PartyTextColumnFilterOptions
} from '@/types/party';
import { Icons } from '@/components/icons';
import type { HasIsActiveRecord } from '@/types/common';
import { TruncateText } from '@/components/common/truncate-text';
import { Link } from '@/i18n/navigation';

export {
  createActiveCancelledStatusColumn,
  createAmountColumn
} from '@/components/common/party-amount-status-columns';

export function createPartyNameColumn<T extends { name: string }>(
  opts?: PartyNameColumnOptions<T>
): ColumnDef<T> {
  return {
    id: 'name',
    accessorKey: 'name',
    size: opts?.size ?? 200,
    header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.col.name')} />,
    meta: {
      label: 'table.col.name',
      placeholderKey: opts?.placeholderKey,
      variant: 'text',
      icon: Icons.search,
      type: 'text',
      primary: true,
      priority: 1,
      mobile: 'title'
    },
    enableColumnFilter: true,
    enableSorting: true,
    cell: ({ row }) => {
      const extra = opts?.cellExtra?.(row.original);
      return (
        <div className='flex min-w-0 items-center gap-2'>
          <TruncateText className='font-medium'>{row.original.name}</TruncateText>
          {extra}
        </div>
      );
    }
  };
}

export function createPartyPhoneColumn<T extends BasePartyRecord>(
  opts?: PartyTextColumnFilterOptions
): ColumnDef<T> {
  const enableFilter = opts?.enableFilter === true;
  return {
    id: 'phone',
    accessorKey: 'phone',
    accessorFn: (row) => row.phone ?? '',
    size: 160,
    header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.col.phone')} />,
    meta: {
      label: 'table.col.phone',
      type: 'phone',
      priority: 2,
      mobile: 'subtitle',
      ...(enableFilter
        ? {
            variant: 'text' as const,
            placeholderKey: opts?.placeholderKey ?? 'table.col.phone',
            icon: Icons.phone
          }
        : {})
    },
    enableColumnFilter: enableFilter,
    enableSorting: true,
    cell: ({ row }) => {
      const phone = (row.original as T).phone;
      return phone ? formatPkMobileLocal(phone) : '—';
    }
  };
}

export function createPartyCnicColumn<T extends BasePartyRecord>(
  opts?: PartyTextColumnFilterOptions
): ColumnDef<T> {
  const enableFilter = opts?.enableFilter === true;
  return {
    id: 'cnic',
    accessorKey: 'cnic',
    accessorFn: (row) => row.cnic ?? '',
    size: 160,
    header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.col.cnic')} />,
    meta: {
      label: 'table.col.cnic',
      type: 'text',
      priority: 3,
      mobile: 'hidden',
      ...(enableFilter
        ? {
            variant: 'text' as const,
            placeholderKey: opts?.placeholderKey ?? 'table.col.cnic',
            icon: Icons.creditCard
          }
        : {})
    },
    enableColumnFilter: enableFilter,
    enableSorting: false,
    cell: ({ row }) => {
      const cnic = (row.original as T).cnic?.trim();
      return cnic || '—';
    }
  };
}

export function createPartyAddressColumn<T extends BasePartyRecord>(
  opts?: PartyTextColumnFilterOptions
): ColumnDef<T> {
  const enableFilter = opts?.enableFilter === true;
  return {
    id: 'address',
    accessorKey: 'address',
    accessorFn: (row) => row.address ?? '',
    size: 200,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('table.col.address')} />
    ),
    meta: {
      label: 'table.col.address',
      type: 'text',
      priority: 3,
      mobile: 'hidden',
      ...(enableFilter
        ? {
            variant: 'text' as const,
            placeholderKey: opts?.placeholderKey ?? 'table.col.address',
            icon: Icons.mapPin
          }
        : {})
    },
    enableColumnFilter: enableFilter,
    enableSorting: false,
    cell: ({ row }) => {
      const address = (row.original as T).address?.trim();
      if (!address) return '—';
      return <TruncateText>{address}</TruncateText>;
    }
  };
}

export function createPartyCurrentBalanceColumn<T extends BasePartyRecord>(
  opts: PartyBalanceColumnOptions<T> | string
): ColumnDef<T> {
  const labelKey = typeof opts === 'string' ? opts : opts.labelKey;
  const ledgerHref = typeof opts === 'string' ? undefined : opts.ledgerHref;
  const enableRange = typeof opts === 'string' ? false : opts.enableRangeFilter === true;
  const range = typeof opts === 'string' ? undefined : opts.range;
  const unit = typeof opts === 'string' ? undefined : opts.unit;
  return {
    id: 'currentBalance',
    accessorKey: 'currentBalance',
    accessorFn: (row) => partyCurrentBalance(row),
    size: 160,
    header: ({ column }) => <DataTableColumnHeader column={column} title={t(labelKey)} />,
    meta: {
      label: labelKey,
      type: 'money',
      priority: 2,
      mobile: 'value',
      ...(enableRange
        ? {
            variant: 'range' as const,
            range,
            unit,
            icon: Icons.cash
          }
        : {})
    },
    enableColumnFilter: enableRange,
    enableSorting: false,
    cell: ({ row }) => {
      const balance = partyCurrentBalance(row.original);
      const href = ledgerHref?.(row.original);
      const className =
        balance > 0
          ? 'font-normal tabular-nums text-amber-700 underline-offset-2 hover:underline dark:text-amber-400'
          : 'font-normal text-foreground underline-offset-2 hover:underline';
      if (href) {
        return (
          <Link href={href} className={className} onClick={(e) => e.stopPropagation()}>
            {formatPkr(balance)}
          </Link>
        );
      }
      return (
        <span
          className={
            balance > 0
              ? 'font-normal tabular-nums text-amber-700 dark:text-amber-400'
              : 'font-normal text-foreground'
          }
        >
          {formatPkr(balance)}
        </span>
      );
    }
  };
}

export function createPartyOpeningBalanceColumn<T extends BasePartyRecord>(
  labelKeyOrOpts: string | PartyBalanceColumnOptions<T>
): ColumnDef<T> {
  const labelKey = typeof labelKeyOrOpts === 'string' ? labelKeyOrOpts : labelKeyOrOpts.labelKey;
  const enableRange =
    typeof labelKeyOrOpts === 'string' ? false : labelKeyOrOpts.enableRangeFilter === true;
  const range = typeof labelKeyOrOpts === 'string' ? undefined : labelKeyOrOpts.range;
  const unit = typeof labelKeyOrOpts === 'string' ? undefined : labelKeyOrOpts.unit;
  return {
    id: 'openingBalance',
    accessorKey: 'openingBalance',
    size: 160,
    header: ({ column }) => <DataTableColumnHeader column={column} title={t(labelKey)} />,
    meta: {
      label: labelKey,
      type: 'money',
      priority: 3,
      mobile: 'hidden',
      ...(enableRange
        ? {
            variant: 'range' as const,
            range,
            unit,
            icon: Icons.cash
          }
        : {})
    },
    enableColumnFilter: enableRange,
    enableSorting: true,
    cell: ({ row }) => (
      <span className='text-muted-foreground'>{formatPkr(row.original.openingBalance)}</span>
    )
  };
}

export function createPartyIsActiveColumn<T extends HasIsActiveRecord>(): ColumnDef<T> {
  return {
    id: 'isActive',
    accessorKey: 'isActive' as keyof T,
    size: 110,
    header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.col.status')} />,
    meta: {
      label: 'table.col.status',
      variant: 'select',
      icon: Icons.status,
      options: [
        {
          get label() {
            return t('status.active');
          },
          value: 'true'
        },
        {
          get label() {
            return t('status.inactive');
          },
          value: 'false'
        }
      ],
      type: 'boolean',
      priority: 4,
      mobile: 'badge'
    },
    enableColumnFilter: true,
    enableSorting: true,
    cell: ({ row }) => (
      <Badge variant={(row.original as T).isActive ? 'default' : 'secondary'}>
        {(row.original as T).isActive ? t('status.active') : t('status.inactive')}
      </Badge>
    )
  };
}

export function PartyActionsHeader() {
  return (
    <span className='h-8 inline-flex items-center text-xs font-medium text-foreground'>
      {t('table.actions')}
    </span>
  );
}

export function partyCurrentBalance(row: BasePartyRecord): number {
  return row.currentBalance ?? row.openingBalance;
}

export function buildPartyMobileItem<T extends BasePartyRecord>(
  valueLabelFn: () => string
): MobileItemConfig<T> {
  return {
    leading: 'avatar',
    title: (row) => row.name,
    subtitle: (row) => (row.phone ? formatPkMobileLocal(row.phone) : undefined),
    badge: (row) => ({
      label: row.isActive ? t('status.active') : t('status.inactive'),
      status: row.isActive ? 'ACTIVE' : 'INACTIVE'
    }),
    value: (row) => formatPkr(partyCurrentBalance(row)),
    valueLabel: valueLabelFn,
    ariaLabel: (row) =>
      `${row.name}, ${row.phone ? formatPkMobileLocal(row.phone) : ''}, ${row.isActive ? 'Active' : 'Inactive'}`
  };
}

export function buildPartyDetail<T extends BasePartyRecord>(
  labels: PartyDetailLabels,
  actions?: (row: T) => DetailAction[]
): DetailConfig<T> {
  return {
    mode: 'sheet',
    title: (row) => row.name,
    badge: (row) => ({
      label: row.isActive ? t('status.active') : t('status.inactive'),
      status: row.isActive ? 'ACTIVE' : 'INACTIVE'
    }),
    value: (row) => formatPkr(partyCurrentBalance(row)),
    sections: (row) => [
      {
        title: labels.partyName,
        fields: [
          { label: t('table.col.name'), value: row.name },
          {
            label: t('table.col.phone'),
            value: row.phone ? (
              <a
                className='text-primary underline-offset-2 hover:underline'
                href={`tel:${formatPkMobileLocal(row.phone)}`}
              >
                {formatPkMobileLocal(row.phone)}
              </a>
            ) : (
              '—'
            )
          },
          ...(row.cnic != null
            ? [{ label: t('dukaan.party.cnic'), value: row.cnic || '—' }]
            : []),
          {
            label: t('table.col.status'),
            value: (
              <StatusBadge
                status={row.isActive ? 'ACTIVE' : 'INACTIVE'}
                label={row.isActive ? t('status.active') : t('status.inactive')}
              />
            )
          },
          {
            label: t('table.col.date'),
            value: formatDate(row.createdAt, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          },
          { label: t('table.address'), value: row.address ?? '—' },
          { label: t('table.col.note'), value: row.notes ?? '—' }
        ]
      },
      {
        title: labels.balance,
        fields: [
          ...(labels.currentBalance
            ? [
                {
                  label: labels.currentBalance,
                  value: formatPkr(partyCurrentBalance(row))
                }
              ]
            : []),
          {
            label: labels.openingBalance,
            value: formatPkr(row.openingBalance)
          }
        ]
      }
    ],
    actions
  };
}

export function getActiveStatusQuickFilters(
  allLabel: string,
  activeLabel: string,
  inactiveLabel: string
): QuickFilterChip[] {
  return [
    { id: 'all', label: allLabel },
    {
      id: 'active',
      label: activeLabel,
      columnId: 'isActive',
      value: ['true']
    },
    {
      id: 'inactive',
      label: inactiveLabel,
      columnId: 'isActive',
      value: ['false']
    }
  ];
}
