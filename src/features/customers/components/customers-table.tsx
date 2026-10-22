'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useQueryState, parseAsString } from 'nuqs';
import { toast } from 'sonner';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import {
  ResponsiveDataTable,
  type DetailConfig,
  type MobileItemConfig
} from '@/components/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { useT } from '@/i18n/use-t';
import { t } from '@/i18n';
import { useRouter } from '@/i18n/navigation';
import { AlertModal } from '@/components/modal/alert-modal';
import {
  DUKAAN_DEFAULT_PAGE_SIZE,
  parseBooleanFacet,
  useDukaanListParams
} from '@/components/data-table/list-params';
import type { CustomerDTO } from '@/lib/api/types';
import { customerKeys, customersQueryOptions } from '../api/queries';
import { deactivateCustomer, reactivateCustomer } from '../api/service';
import type {
  CustomerCellActionProps,
  CustomerListFilters,
  CustomersTableProps,
  EntityStatusConfirm
} from '@/types';
import { CustomerDialog } from './customer-dialog';
import {
  createPartyNameColumn,
  createPartyPhoneColumn,
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
import {
  firstFilterValue as firstCustomerFilterValue,
  MONEY_RANGE_RUPEES as CUSTOMER_MONEY_RANGE_RUPEES,
  parseRupeeMoneyRange
} from '@/lib/dukaan/money-range-filter';

function CustomerCellAction({ data }: CustomerCellActionProps) {
  const t = useT();

  return (
    <PartyCellAction
      id={data.id}
      isActive={data.isActive}
      ledgerHref={`/dashboard/customers/${data.id}`}
      deactivateTitle={t('dukaan.party.customerArchiveTitle')}
      deactivateDescription={t('dukaan.party.customerArchiveDescription')}
      deactivateConfirmLabel={t('common.archive')}
      deactivateSuccess={t('dukaan.party.customerArchived')}
      activateTitle={t('dukaan.party.customerActivateTitle')}
      activateDescription={t('dukaan.party.customerActivateDescription')}
      activateConfirmLabel={t('common.activate')}
      activateSuccess={t('dukaan.party.customerActivated')}
      onDeactivate={deactivateCustomer}
      onActivate={reactivateCustomer}
      invalidateQueryKey={customerKeys.all}
      renderEditDialog={(open, onOpenChange) => (
        <CustomerDialog open={open} onOpenChange={onOpenChange} customer={data} />
      )}
    />
  );
}

const customerColumns: ColumnDef<CustomerDTO>[] = [
  createPartyNameColumn<CustomerDTO>({ placeholderKey: 'search.customers' }),
  createPartyPhoneColumn<CustomerDTO>({ enableFilter: true }),
  createPartyAddressColumn<CustomerDTO>({ enableFilter: true }),
  createPartyCurrentBalanceColumn<CustomerDTO>({
    labelKey: 'dukaan.party.currentUdhar',
    ledgerHref: (row) => `/dashboard/customers/${row.id}`,
    enableRangeFilter: true,
    range: CUSTOMER_MONEY_RANGE_RUPEES,
    unit: 'Rs'
  }),
  createPartyOpeningBalanceColumn<CustomerDTO>({
    labelKey: 'dukaan.party.customerOpeningBalance',
    enableRangeFilter: true,
    range: CUSTOMER_MONEY_RANGE_RUPEES,
    unit: 'Rs'
  }),
  createPartyIsActiveColumn<CustomerDTO>(),
  {
    id: 'actions',
    size: 72,
    header: PartyActionsHeader,
    enableSorting: false,
    enableHiding: false,
    meta: { mobile: 'hidden' },
    cell: ({ row }) => (
      <div className='flex justify-end'>
        <CustomerCellAction data={row.original} />
      </div>
    )
  }
];

const customerMobileItem: MobileItemConfig<CustomerDTO> = buildPartyMobileItem<CustomerDTO>(() =>
  t('dukaan.party.currentUdhar')
);

export function CustomersTable({ toolbarAction }: CustomersTableProps) {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const [editCustomer, setEditCustomer] = useState<CustomerDTO | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<EntityStatusConfirm | null>(
    null
  );

  const sortableColumnIds = ['name', 'phone', 'openingBalance', 'isActive'];
  const { params, filters, sortBy, sortOrder, getPageCount } = useDukaanListParams<
    CustomerListFilters['sortBy']
  >(
    sortableColumnIds,
    'name',
    ['isActive', 'phone', 'address', 'currentBalance', 'openingBalance'],
    'name',
    'asc'
  );

  const [nameParam] = useQueryState('name', parseAsString);
  const [searchParam] = useQueryState('search', parseAsString);
  const [isActiveParam] = useQueryState('isActive', parseAsString);
  const [phoneParam] = useQueryState('phone', parseAsString);
  const [addressParam] = useQueryState('address', parseAsString);

  const search = searchParam || nameParam || undefined;
  const isActiveFilter = parseBooleanFacet(
    (filters as Record<string, unknown>).isActive ?? isActiveParam
  );
  const phoneFilter =
    firstCustomerFilterValue((filters as Record<string, unknown>).phone) ??
    (phoneParam?.trim() || undefined);
  const addressFilter =
    firstCustomerFilterValue((filters as Record<string, unknown>).address) ??
    (addressParam?.trim() || undefined);
  const creditRange = parseRupeeMoneyRange(
    (filters as Record<string, unknown>).currentBalance
  );
  const openingRange = parseRupeeMoneyRange(
    (filters as Record<string, unknown>).openingBalance
  );

  const { data, isFetching } = useQuery(
    customersQueryOptions({
      page: params.page,
      pageSize: params.perPage,
      search: search || undefined,
      phone: phoneFilter,
      address: addressFilter,
      minOpeningBalance: openingRange.minAmount,
      maxOpeningBalance: openingRange.maxAmount,
      minCurrentBalance: creditRange.minAmount,
      maxCurrentBalance: creditRange.maxAmount,
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
    columns: customerColumns,
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
      if (statusConfirm.nextActive) await reactivateCustomer(statusConfirm.id);
      else await deactivateCustomer(statusConfirm.id);
    },
    onSuccess: () => {
      const message = statusConfirm?.nextActive
        ? t('dukaan.party.customerActivated')
        : t('dukaan.party.customerArchived');
      setStatusConfirm(null);
      void qc.invalidateQueries({ queryKey: customerKeys.all });
      toastSuccessAfterClose(message);
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const customerDetail: DetailConfig<CustomerDTO> = useMemo(
    () =>
      buildPartyDetail<CustomerDTO>(
        {
          partyName: t('dukaan.party.name'),
          balance: t('table.balance'),
          currentBalance: t('dukaan.party.currentUdhar'),
          openingBalance: t('dukaan.party.customerOpeningBalance')
        },
        (row) => [
          {
            label: t('common.edit'),
            onClick: () => setEditCustomer(row)
          },
          {
            label: t('table.openLedger'),
            variant: 'secondary',
            onClick: () => router.push(`/dashboard/customers/${row.id}`)
          },
          row.isActive
            ? {
                label: t('common.archive'),
                variant: 'destructive',
                onClick: () => setStatusConfirm({ id: row.id, nextActive: false })
              }
            : {
                label: t('common.activate'),
                variant: 'secondary',
                onClick: () => setStatusConfirm({ id: row.id, nextActive: true })
              }
        ]
      ),
    [router, t]
  );

  const customerQuickFilters = getActiveStatusQuickFilters(
    t('table.all'),
    t('status.active'),
    t('status.inactive')
  );

  return (
    <>
      {editCustomer ? (
        <CustomerDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditCustomer(null);
          }}
          customer={editCustomer}
        />
      ) : null}
      <AlertModal
        isOpen={statusConfirm != null}
        onClose={() => setStatusConfirm(null)}
        onConfirm={() => statusMutation.mutate()}
        loading={statusMutation.isPending}
        title={
          statusConfirm?.nextActive
            ? t('dukaan.party.customerActivateTitle')
            : t('dukaan.party.customerArchiveTitle')
        }
        description={
          statusConfirm?.nextActive
            ? t('dukaan.party.customerActivateDescription')
            : t('dukaan.party.customerArchiveDescription')
        }
        confirmLabel={
          statusConfirm?.nextActive ? t('common.activate') : t('common.archive')
        }
        confirmVariant={statusConfirm?.nextActive ? 'default' : 'destructive'}
      />
      <ResponsiveDataTable
        table={table}
        toolbarAction={toolbarAction}
        mobileItem={customerMobileItem}
        detail={customerDetail}
        quickFilters={customerQuickFilters}
        isLoading={isFetching}
      />
    </>
  );
}
