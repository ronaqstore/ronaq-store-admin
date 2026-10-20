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
import { t } from '@/i18n';
import type {
  BasePartyRecord,
  PartyDetailLabels,
  PartyNameColumnOptions
} from '@/types/party';
import { Icons } from '@/components/icons';
import type {
  HasStatusRecord,
  HasAmountRecord,
  HasIsActiveRecord,
  Icon,
  NamedActiveItem
} from '@/types/common';
import { TruncateText } from '@/components/common/truncate-text';

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

export function createPartyPhoneColumn<T extends BasePartyRecord>(): ColumnDef<T> {
  return {
    id: 'phone',
    accessorKey: 'phone',
    size: 160,
    header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.col.phone')} />,
    meta: { label: 'table.col.phone', type: 'phone', priority: 2, mobile: 'subtitle' },
    enableSorting: true,
    cell: ({ row }) => (row.original as T).phone || '—'
  };
}

export function createPartyCnicColumn<T extends BasePartyRecord>(): ColumnDef<T> {
  return {
    id: 'cnic',
    accessorKey: 'cnic',
    size: 160,
    header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.col.cnic')} />,
    meta: { label: 'table.col.cnic', type: 'text', priority: 3, mobile: 'hidden' },
    enableSorting: false,
    cell: ({ row }) => {
      const cnic = (row.original as T).cnic?.trim();
      return cnic || '—';
    }
  };
}

export function createPartyAddressColumn<T extends BasePartyRecord>(): ColumnDef<T> {
  return {
    id: 'address',
    accessorKey: 'address',
    size: 200,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('table.col.address')} />
    ),
    meta: { label: 'table.col.address', type: 'text', priority: 3, mobile: 'hidden' },
    enableSorting: false,
    cell: ({ row }) => {
      const address = (row.original as T).address?.trim();
      if (!address) return '—';
      return <TruncateText>{address}</TruncateText>;
    }
  };
}

export function createPartyCurrentBalanceColumn<T extends BasePartyRecord>(
  labelKey: string
): ColumnDef<T> {
  return {
    id: 'currentBalance',
    accessorKey: 'currentBalance',
    size: 160,
    header: ({ column }) => <DataTableColumnHeader column={column} title={t(labelKey)} />,
    meta: {
      label: labelKey,
      type: 'money',
      priority: 2,
      mobile: 'value'
    },
    enableSorting: false,
    cell: ({ row }) => {
      const balance = partyCurrentBalance(row.original);
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
  labelKey: string
): ColumnDef<T> {
  return {
    id: 'openingBalance',
    accessorKey: 'openingBalance',
    size: 160,
    header: ({ column }) => <DataTableColumnHeader column={column} title={t(labelKey)} />,
    meta: {
      label: labelKey,
      type: 'money',
      priority: 3,
      mobile: 'hidden'
    },
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
      icon: Icons.circle,
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
    subtitle: (row) => row.phone ?? undefined,
    badge: (row) => ({
      label: row.isActive ? t('status.active') : t('status.inactive'),
      status: row.isActive ? 'ACTIVE' : 'INACTIVE'
    }),
    value: (row) => formatPkr(partyCurrentBalance(row)),
    valueLabel: valueLabelFn,
    ariaLabel: (row) => `${row.name}, ${row.phone ?? ''}, ${row.isActive ? 'Active' : 'Inactive'}`
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
                href={`tel:${row.phone}`}
              >
                {row.phone}
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

export function createActiveCancelledStatusColumn<T extends HasStatusRecord>(
  statusTitle: string
): ColumnDef<T> {
  return {
    id: 'status',
    accessorKey: 'status' as keyof T,
    header: ({ column }) => <DataTableColumnHeader column={column} title={statusTitle} />,
    cell: ({ row }) => {
      const isCancelled = (row.original as T).status === 'CANCELLED';
      return (
        <StatusBadge
          status={(row.original as T).status}
          label={isCancelled ? 'Cancelled' : 'Active'}
        />
      );
    },
    meta: {
      label: 'table.col.status',
      variant: 'select',
      icon: Icons.circle,
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ],
      priority: 2,
      mobile: 'badge'
    },
    enableColumnFilter: true,
    enableSorting: true
  };
}

export function createAmountColumn<T extends HasAmountRecord>(amountTitle: string): ColumnDef<T> {
  return {
    id: 'amount',
    accessorKey: 'amount' as keyof T,
    header: ({ column }) => <DataTableColumnHeader column={column} title={amountTitle} />,
    cell: ({ row }) => (
      <span className='font-normal text-foreground'>{formatPkr((row.original as T).amount)}</span>
    ),
    meta: {
      label: 'table.col.amount',
      variant: 'number',
      priority: 1,
      mobile: 'value'
    },
    enableColumnFilter: false,
    enableSorting: true
  };
}

export function buildSimpleEntityMobileItem<T extends NamedActiveItem>(
  leadingIcon: Icon
): MobileItemConfig<T> {
  return {
    leading: 'icon',
    leadingIcon,
    title: (row) => row.name,
    subtitle: (row) => (row.isActive ? t('status.active') : t('status.inactive')),
    ariaLabel: (row) => `${row.name}, ${row.isActive ? t('status.active') : t('status.inactive')}`
  };
}

export function buildSimpleEntityDetail<T extends NamedActiveItem>(
  sectionTitle: string
): DetailConfig<T> {
  return {
    mode: 'sheet',
    title: (row) => row.name,
    badge: (row) => ({
      label: row.isActive ? t('status.active') : t('status.inactive'),
      status: row.isActive ? 'ACTIVE' : 'INACTIVE'
    }),
    sections: (row) => [
      {
        title: sectionTitle,
        fields: [
          { label: t('table.col.name'), value: row.name },
          {
            label: t('table.col.status'),
            value: (
              <StatusBadge
                status={row.isActive ? 'ACTIVE' : 'INACTIVE'}
                label={row.isActive ? t('status.active') : t('status.inactive')}
              />
            )
          }
        ]
      }
    ]
  };
}
