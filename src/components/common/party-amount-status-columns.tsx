'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import { formatPkr } from '@/lib/dukaan/numbers';
import type { AmountColumnOptions } from '@/types/party';
import type { HasAmountRecord, HasStatusRecord } from '@/types/common';

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
      icon: Icons.status,
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ],
      priority: 2,
      mobile: 'badge'
    },
    enableColumnFilter: true,
    enableSorting: false
  };
}

export function createAmountColumn<T extends HasAmountRecord>(
  amountTitle: string,
  opts?: AmountColumnOptions
): ColumnDef<T> {
  const enableRange = opts?.enableRangeFilter === true;
  return {
    id: 'amount',
    accessorKey: 'amount' as keyof T,
    header: ({ column }) => <DataTableColumnHeader column={column} title={amountTitle} />,
    cell: ({ row }) => (
      <span className='font-normal text-foreground'>{formatPkr((row.original as T).amount)}</span>
    ),
    meta: {
      label: 'table.col.amount',
      variant: enableRange ? 'range' : 'number',
      range: opts?.range,
      unit: opts?.unit,
      icon: enableRange ? Icons.cash : undefined,
      priority: 1,
      mobile: 'value'
    },
    enableColumnFilter: enableRange,
    enableSorting: true
  };
}
