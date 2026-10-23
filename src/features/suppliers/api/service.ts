import { apiRequest } from '@/lib/api/client';
import type {
  PaginatedResponse,
  SupplierDTO,
  CreateSupplierInput,
  UpdateSupplierInput
} from '@/lib/api/types';
import type {
  SupplierListFilters,
  SupplierLedgerDTO,
  SupplierLedgerView
} from '@/types';
import { appFetch } from '@/lib/api/app-fetch';

import { buildQueryString } from '@/lib/api/query-params';

export async function listSuppliers(
  filters: SupplierListFilters = {},
  token?: string
): Promise<PaginatedResponse<SupplierDTO>> {
  const qs = buildQueryString({
    ...filters,
    pageSize: filters.pageSize ?? filters.limit
  } as Record<string, unknown>);

  if (token) {
    return apiRequest<PaginatedResponse<SupplierDTO>>(`/suppliers${qs}`, undefined, token);
  }

  return appFetch<PaginatedResponse<SupplierDTO>>(`/api/suppliers${qs}`);
}

export async function createSupplier(data: CreateSupplierInput): Promise<SupplierDTO> {
  return appFetch<SupplierDTO>('/api/suppliers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function updateSupplier(id: string, data: UpdateSupplierInput): Promise<SupplierDTO> {
  return appFetch<SupplierDTO>(`/api/suppliers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function deactivateSupplier(id: string): Promise<SupplierDTO> {
  return updateSupplier(id, { isActive: false });
}

export async function reactivateSupplier(id: string): Promise<SupplierDTO> {
  return updateSupplier(id, { isActive: true });
}

export async function getSupplierById(id: string, token?: string): Promise<SupplierDTO> {
  if (token) {
    return apiRequest<SupplierDTO>(`/suppliers/${id}`, undefined, token);
  }
  return appFetch<SupplierDTO>(`/api/suppliers/${id}`);
}

export async function getSupplierLedger(
  id: string,
  filters: { page?: number; pageSize?: number } = {},
  token?: string
): Promise<SupplierLedgerDTO> {
  const qs = buildQueryString({
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 100
  });

  if (token) {
    return apiRequest<SupplierLedgerDTO>(`/suppliers/${id}/ledger${qs}`, undefined, token);
  }
  return appFetch<SupplierLedgerDTO>(`/api/suppliers/${id}/ledger${qs}`);
}

export async function getSupplierLedgerView(
  id: string,
  token?: string
): Promise<SupplierLedgerView> {
  const [supplier, ledger] = await Promise.all([
    getSupplierById(id, token),
    getSupplierLedger(id, { page: 1, pageSize: 100 }, token)
  ]);

  return {
    id: supplier.id,
    name: supplier.name,
    phone: supplier.phone ?? null,
    address: supplier.address ?? null,
    notes: supplier.notes ?? null,
    openingBalance: ledger.openingBalance,
    payable: ledger.balance,
    ledger: ledger.items.map((row) => ({
      id: row.id,
      date: row.date,
      type: row.type,
      reference: row.reference ?? null,
      status: row.status,
      amount: row.delta,
      running_balance: row.balance
    }))
  };
}
