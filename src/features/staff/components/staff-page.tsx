'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { parseAsString, useQueryState } from 'nuqs';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FloatingActionButton } from '@/components/common/floating-action-button';
import { RowActionsMenu } from '@/components/common/row-actions-menu';
import { TablePageBody } from '@/components/layout/table-page-body';
import { AlertModal } from '@/components/modal/alert-modal';
import {
  ResponsiveDataTable,
  StatusBadge,
  type DetailConfig,
  type MobileItemConfig
} from '@/components/data-table';
import { DUKAAN_DEFAULT_PAGE_SIZE, useDukaanListParams } from '@/components/data-table/list-params';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { useDataTable } from '@/hooks/use-data-table';
import { formatIsoDate } from '@/lib/dates';
import type { StaffUserDto } from '@/lib/api/types';
import type {
  RowAction,
  StaffCellActionProps,
  StaffPermissionsCellProps,
  StaffStatusCellProps
} from '@/types';
import { staffKeys, staffListQueryOptions } from '../api/queries';
import { deleteStaff, updateStaff } from '../api/service';
import { getRoleBadgeVariant, getRoleLabel } from '../helpers/staff-helpers';
import { StaffDialog } from './staff-dialog';

function StaffCellAction({ staff, onEdit, onToggleStatus, isLoading }: StaffCellActionProps) {
  const t = useTranslations('staff');

  const actions: RowAction[] = [
    {
      label: t('edit'),
      icon: Icons.edit,
      onClick: () => onEdit(staff)
    },
    ...(staff.role !== 'OWNER'
      ? [
          staff.status === 'ACTIVE'
            ? {
                label: t('suspend'),
                icon: Icons.close,
                variant: 'destructive' as const,
                disabled: isLoading,
                onClick: () => onToggleStatus(staff)
              }
            : {
                label: t('activate'),
                icon: Icons.check,
                className: 'text-emerald-600 focus:text-emerald-700 dark:text-emerald-400',
                disabled: isLoading,
                onClick: () => onToggleStatus(staff)
              }
        ]
      : [])
  ];

  return (
    <div onClick={(e) => e.stopPropagation()} data-slot='action-cell'>
      <RowActionsMenu actions={actions} />
    </div>
  );
}

function PermissionsCell({ role }: StaffPermissionsCellProps) {
  const t = useTranslations('staff');
  if (role === 'SALESMAN') {
    return (
      <span className='inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400'>
        <Icons.lock className='h-3.5 w-3.5 shrink-0' />
        <span>{t('salesmanRestrictedTag')}</span>
      </span>
    );
  }
  return (
    <span className='inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400'>
      <Icons.check className='h-3.5 w-3.5 shrink-0' />
      <span>{t('managerStandardTag')}</span>
    </span>
  );
}

function StatusCell({ status }: StaffStatusCellProps) {
  const t = useTranslations('staff');
  const isActive = status === 'ACTIVE';
  return (
    <StatusBadge
      status={status}
      label={isActive ? t('statusActive') : t('statusSuspended')}
      tone={isActive ? 'success' : 'danger'}
    />
  );
}

export function StaffPage() {
  const t = useTranslations('staff');
  const queryClient = useQueryClient();

  const { data: staffList = [], isLoading } = useQuery(staffListQueryOptions());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffUserDto | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<StaffUserDto | null>(null);

  const sortableColumnIds = ['name', 'createdAt'];
  const { params } = useDukaanListParams(sortableColumnIds, 'name', [], 'name', 'asc');

  const [nameParam] = useQueryState('name', parseAsString);
  const [searchParam] = useQueryState('search', parseAsString);
  const searchQuery = (searchParam || nameParam || '').trim().toLowerCase();

  const filteredStaff = useMemo(() => {
    if (!searchQuery) return staffList;
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery) ||
        s.phone.toLowerCase().includes(searchQuery) ||
        s.role.toLowerCase().includes(searchQuery)
    );
  }, [staffList, searchQuery]);

  const handleAddClick = () => {
    setSelectedStaff(null);
    setDialogOpen(true);
  };

  const handleEditClick = (staff: StaffUserDto) => {
    setSelectedStaff(staff);
    setDialogOpen(true);
  };

  const handleToggleStatus = (staff: StaffUserDto) => {
    if (staff.status === 'ACTIVE') {
      setSuspendTarget(staff);
    } else {
      void executeStatusChange(staff, 'ACTIVE');
    }
  };

  const executeStatusChange = async (staff: StaffUserDto, targetStatus: 'ACTIVE' | 'SUSPENDED') => {
    try {
      setActionLoadingId(staff.id);
      if (targetStatus === 'SUSPENDED') {
        await deleteStaff(staff.id);
        toast.success(t('staffSuspended'));
      } else {
        await updateStaff(staff.id, { status: 'ACTIVE' });
        toast.success(t('staffActivated'));
      }
      await queryClient.invalidateQueries({ queryKey: staffKeys.all });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('actionFailed');
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
      setSuspendTarget(null);
    }
  };

  const staffColumns: ColumnDef<StaffUserDto>[] = useMemo(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        size: 180,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('name')} />,
        meta: {
          label: 'staff.name',
          variant: 'text',
          primary: true,
          priority: 1,
          mobile: 'title'
        },
        enableColumnFilter: true,
        enableSorting: true,
        cell: ({ row }) => <span className='font-medium text-foreground'>{row.original.name}</span>
      },
      {
        id: 'phone',
        accessorKey: 'phone',
        size: 150,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('phone')} />,
        meta: {
          label: 'staff.phone',
          priority: 2,
          mobile: 'subtitle'
        },
        enableSorting: false,
        cell: ({ row }) => (
          <span className='font-mono text-xs text-muted-foreground'>{row.original.phone}</span>
        )
      },
      {
        id: 'role',
        accessorKey: 'role',
        size: 120,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('role')} />,
        meta: {
          label: 'staff.role',
          priority: 2,
          mobile: 'badge'
        },
        enableSorting: true,
        cell: ({ row }) => (
          <Badge variant={getRoleBadgeVariant(row.original.role)}>
            {getRoleLabel(row.original.role)}
          </Badge>
        )
      },
      {
        id: 'permissions',
        size: 180,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('permissionsSummary')} />
        ),
        meta: {
          label: 'staff.permissionsSummary',
          priority: 3,
          mobile: 'hidden'
        },
        enableSorting: false,
        cell: ({ row }) => <PermissionsCell role={row.original.role} />
      },
      {
        id: 'status',
        accessorKey: 'status',
        size: 120,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('status')} />,
        meta: {
          label: 'staff.status',
          priority: 2
        },
        enableSorting: true,
        cell: ({ row }) => <StatusCell status={row.original.status} />
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        size: 140,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('dateJoined')} />,
        meta: {
          label: 'staff.dateJoined',
          priority: 4,
          mobile: 'hidden'
        },
        enableSorting: true,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {row.original.createdAt ? formatIsoDate(row.original.createdAt) : '—'}
          </span>
        )
      },
      {
        id: 'actions',
        size: 48,
        enableSorting: false,
        enableHiding: false,
        meta: { mobile: 'hidden' },
        cell: ({ row }) => (
          <div className='flex justify-end'>
            <StaffCellAction
              staff={row.original}
              onEdit={handleEditClick}
              onToggleStatus={handleToggleStatus}
              isLoading={actionLoadingId === row.original.id}
            />
          </div>
        )
      }
    ],
    [actionLoadingId, t]
  );

  const staffMobileItem: MobileItemConfig<StaffUserDto> = useMemo(
    () => ({
      leading: 'avatar',
      title: (row) => row.name,
      subtitle: (row) => row.phone,
      badge: (row) => ({
        label: getRoleLabel(row.role),
        status: row.role,
        tone: row.role === 'OWNER' ? 'danger' : row.role === 'MANAGER' ? 'neutral' : 'warning'
      }),
      meta: [
        (row) => (
          <span
            key='status'
            className={
              row.status === 'ACTIVE'
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : 'text-destructive font-medium'
            }
          >
            {row.status === 'ACTIVE' ? t('statusActive') : t('statusSuspended')}
          </span>
        ),
        (row) => (row.createdAt ? formatIsoDate(row.createdAt) : '')
      ]
    }),
    [t]
  );

  const staffDetail: DetailConfig<StaffUserDto> = useMemo(
    () => ({
      mode: 'sheet',
      title: (row) => row.name,
      badge: (row) => ({
        label: getRoleLabel(row.role),
        status: row.role,
        tone: row.role === 'OWNER' ? 'danger' : row.role === 'MANAGER' ? 'neutral' : 'warning'
      }),
      sections: (row) => [
        {
          title: t('staffListTitle'),
          fields: [
            { label: t('name'), value: row.name },
            { label: t('phone'), value: row.phone },
            { label: t('role'), value: getRoleLabel(row.role) },
            {
              label: t('permissionsSummary'),
              value: row.role === 'SALESMAN' ? t('salesmanRestrictedTag') : t('managerStandardTag')
            },
            {
              label: t('status'),
              value: (
                <StatusBadge
                  status={row.status}
                  label={row.status === 'ACTIVE' ? t('statusActive') : t('statusSuspended')}
                  tone={row.status === 'ACTIVE' ? 'success' : 'danger'}
                />
              )
            },
            {
              label: t('dateJoined'),
              value: row.createdAt ? formatIsoDate(row.createdAt) : '—'
            }
          ]
        }
      ],
      actions: (row) => [
        {
          label: t('edit'),
          icon: Icons.edit,
          onClick: () => handleEditClick(row)
        },
        ...(row.role !== 'OWNER'
          ? [
              {
                label: row.status === 'ACTIVE' ? t('suspend') : t('activate'),
                icon: row.status === 'ACTIVE' ? Icons.close : Icons.check,
                variant: row.status === 'ACTIVE' ? ('destructive' as const) : ('default' as const),
                onClick: () => handleToggleStatus(row)
              }
            ]
          : [])
      ]
    }),
    [t]
  );

  const pageCount = Math.max(1, Math.ceil(filteredStaff.length / params.perPage));

  const { table } = useDataTable({
    data: filteredStaff,
    columns: staffColumns,
    pageCount,
    rowCount: filteredStaff.length,
    shallow: true,
    debounceMs: 300,
    initialState: {
      pagination: { pageIndex: 0, pageSize: DUKAAN_DEFAULT_PAGE_SIZE }
    }
  });

  const toolbarActionButton = (
    <div className='flex min-w-0 w-full items-center gap-1.5 sm:w-auto'>
      <Button
        type='button'
        size='sm'
        className='h-8 min-h-8 shrink-0 whitespace-nowrap gap-1.5 text-xs hidden md:inline-flex'
        onClick={handleAddClick}
      >
        <Icons.add className='h-3.5 w-3.5 shrink-0' />
        <span>{t('addStaffButton')}</span>
      </Button>
    </div>
  );

  return (
    <TablePageBody>
      <ResponsiveDataTable
        table={table}
        toolbarAction={toolbarActionButton}
        mobileItem={staffMobileItem}
        detail={staffDetail}
        isLoading={isLoading}
      />

      <FloatingActionButton label={t('addStaffButton')} onClick={handleAddClick} />

      <StaffDialog open={dialogOpen} onOpenChange={setDialogOpen} staff={selectedStaff} />

      {suspendTarget && (
        <AlertModal
          isOpen={!!suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onConfirm={() => void executeStatusChange(suspendTarget, 'SUSPENDED')}
          loading={actionLoadingId === suspendTarget.id}
          title={t('suspend')}
          description={`${suspendTarget.name} (${suspendTarget.phone})`}
          confirmLabel={t('suspend')}
        />
      )}
    </TablePageBody>
  );
}
