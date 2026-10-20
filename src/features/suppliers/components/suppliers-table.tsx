'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useQueryState, parseAsString } from 'nuqs';
import { toast } from 'sonner';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveDataTable,
  type DetailConfig,
  type MobileItemConfig
} from '@/components/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { useT } from '@/i18n/use-t';
import { t } from '@/i18n';
import { AlertModal } from '@/components/modal/alert-modal';
import {
  DUKAAN_DEFAULT_PAGE_SIZE,
  parseBooleanFacet,
  useDukaanListParams
} from '@/components/data-table/list-params';
import type { SupplierDTO } from '@/lib/api/types';
import { supplierKeys, suppliersQueryOptions } from '../api/queries';
import { deactivateSupplier, reactivateSupplier } from '../api/service';
import type { EntityStatusConfirm, SupplierListFilters } from '@/types';
import { SupplierDialog } from './supplier-dialog';
import type { SupplierCellActionProps, SuppliersTableProps } from '@/types/suppliers';
import {
  createPartyNameColumn,
  createPartyPhoneColumn,
  createPartyCnicColumn,
  createPartyAddressColumn,
  createPartyCurrentBalanceColumn,
  createPartyOpeningBalanceColumn,
  createPartyIsActiveColumn,
  PartyActionsHeader,
  buildPartyMobileItem,
  buildPartyDetail,
  getActiveStatusQuickFilters
} from '@/components/common/party-table-helpers';
import { PartyCellAction } from '@/components/common/party-cell-action';

function SupplierCellAction({ data }: SupplierCellActionProps) {
  const t = useT();

  return (
    <PartyCellAction
      id={data.id}
      isActive={data.isActive}
      isSystem={data.isSystem}
      deactivateTitle={t('dukaan.party.supplierDeactivateTitle')}
      deactivateDescription={t('dukaan.party.supplierDeactivateDescription')}
      deactivateConfirmLabel={t('common.deactivate')}
      deactivateSuccess={t('dukaan.party.supplierDeactivated')}
      activateTitle={t('dukaan.party.supplierActivateTitle')}
      activateDescription={t('dukaan.party.supplierActivateDescription')}
      activateConfirmLabel={t('common.activate')}
      activateSuccess={t('dukaan.party.supplierActivated')}
      onDeactivate={deactivateSupplier}
      onActivate={reactivateSupplier}
      invalidateQueryKey={supplierKeys.all}
      renderEditDialog={(open, onOpenChange) => (
        <SupplierDialog open={open} onOpenChange={onOpenChange} supplier={data} />
      )}
    />
  );
}

const supplierColumns: ColumnDef<SupplierDTO>[] = [
  createPartyNameColumn<SupplierDTO>({
    placeholderKey: 'search.suppliers',
    cellExtra: (row) =>
      row.isSystem ? (
        <Badge variant='outline' className='shrink-0 text-[10px] uppercase font-semibold'>
          {t('common.system')}
        </Badge>
      ) : null
  }),
  createPartyPhoneColumn<SupplierDTO>(),
  createPartyCnicColumn<SupplierDTO>(),
  createPartyAddressColumn<SupplierDTO>(),
  createPartyCurrentBalanceColumn<SupplierDTO>('dukaan.party.currentPayable'),
  createPartyOpeningBalanceColumn<SupplierDTO>('dukaan.party.supplierOpeningBalance'),
  createPartyIsActiveColumn<SupplierDTO>(),
  {
    id: 'actions',
    size: 72,
    header: PartyActionsHeader,
    enableSorting: false,
    enableHiding: false,
    meta: { mobile: 'hidden' },
    cell: ({ row }) => (
      <div className='flex justify-end'>
        <SupplierCellAction data={row.original} />
      </div>
    )
  }
];

const supplierMobileItem: MobileItemConfig<SupplierDTO> = buildPartyMobileItem<SupplierDTO>(() =>
  t('dukaan.party.currentPayable')
);

export function SuppliersTable({ toolbarAction }: SuppliersTableProps) {
  const t = useT();
  const qc = useQueryClient();
  const [editSupplier, setEditSupplier] = useState<SupplierDTO | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<EntityStatusConfirm | null>(
    null
  );

  const sortableColumnIds = ['name', 'phone', 'openingBalance', 'isActive'];
  const { params, sortBy, sortOrder, getPageCount } = useDukaanListParams<
    SupplierListFilters['sortBy']
  >(sortableColumnIds, 'name', ['isActive'], 'name', 'asc');

  const [nameParam] = useQueryState('name', parseAsString);
  const [searchParam] = useQueryState('search', parseAsString);
  const [isActiveParam] = useQueryState('isActive', parseAsString);

  const search = searchParam || nameParam || undefined;
  const isActiveFilter = parseBooleanFacet(isActiveParam);

  const { data, isFetching } = useQuery(
    suppliersQueryOptions({
      page: params.page,
      pageSize: params.perPage,
      search: search || undefined,
      isActive: isActiveFilter,
      sortBy,
      sortOrder
    })
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = getPageCount(total);
  const { table } = useDataTable({
    data: items,
    columns: supplierColumns,
    pageCount,
    rowCount: total,
    shallow: true,
    debounceMs: 400,
    initialState: {
      pagination: { pageIndex: 0, pageSize: DUKAAN_DEFAULT_PAGE_SIZE }
    }
  });

  const statusMutation = useMutation({
    mutationFn: async () => {
      if (!statusConfirm) return;
      if (statusConfirm.nextActive) await reactivateSupplier(statusConfirm.id);
      else await deactivateSupplier(statusConfirm.id);
    },
    onSuccess: () => {
      const message = statusConfirm?.nextActive
        ? t('dukaan.party.supplierActivated')
        : t('dukaan.party.supplierDeactivated');
      setStatusConfirm(null);
      void qc.invalidateQueries({ queryKey: supplierKeys.all });
      toastSuccessAfterClose(message);
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const supplierDetail: DetailConfig<SupplierDTO> = useMemo(
    () =>
      buildPartyDetail<SupplierDTO>(
        {
          partyName: t('dukaan.party.name'),
          balance: t('table.balance'),
          currentBalance: t('dukaan.party.currentPayable'),
          openingBalance: t('dukaan.party.supplierOpeningBalance')
        },
        (row) => [
          {
            label: t('common.edit'),
            onClick: () => setEditSupplier(row)
          },
          ...(!row.isSystem && row.isActive
            ? [
                {
                  label: t('common.deactivate'),
                  variant: 'destructive' as const,
                  onClick: () => setStatusConfirm({ id: row.id, nextActive: false })
                }
              ]
            : []),
          ...(!row.isSystem && !row.isActive
            ? [
                {
                  label: t('common.activate'),
                  variant: 'secondary' as const,
                  onClick: () => setStatusConfirm({ id: row.id, nextActive: true })
                }
              ]
            : [])
        ]
      ),
    [t]
  );

  const supplierQuickFilters = getActiveStatusQuickFilters(
    t('table.all'),
    t('status.active'),
    t('status.inactive')
  );

  return (
    <>
      {editSupplier ? (
        <SupplierDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditSupplier(null);
          }}
          supplier={editSupplier}
        />
      ) : null}
      <AlertModal
        isOpen={statusConfirm != null}
        onClose={() => setStatusConfirm(null)}
        onConfirm={() => statusMutation.mutate()}
        loading={statusMutation.isPending}
        title={
          statusConfirm?.nextActive
            ? t('dukaan.party.supplierActivateTitle')
            : t('dukaan.party.supplierDeactivateTitle')
        }
        description={
          statusConfirm?.nextActive
            ? t('dukaan.party.supplierActivateDescription')
            : t('dukaan.party.supplierDeactivateDescription')
        }
        confirmLabel={
          statusConfirm?.nextActive ? t('common.activate') : t('common.deactivate')
        }
        confirmVariant={statusConfirm?.nextActive ? 'default' : 'destructive'}
      />
      <ResponsiveDataTable
        table={table}
        toolbarAction={toolbarAction}
        mobileItem={supplierMobileItem}
        detail={supplierDetail}
        quickFilters={supplierQuickFilters}
        isLoading={isFetching}
      />
    </>
  );
}
