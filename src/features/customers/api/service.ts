import { apiRequest } from '@/lib/api/client';
import type { PaginatedResponse, CustomerDTO } from '@/lib/api/types';
import type {
  CustomerListFilters,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerMutationResult,
  CustomerLedgerDTO,
  CustomerLedgerView
} from '@/types';
import { appFetch } from '@/lib/api/app-fetch';

import { buildQueryString } from '@/lib/api/query-params';

export async function listCustomers(
  filters: CustomerListFilters = {},
  token?: string
): Promise<PaginatedResponse<CustomerDTO>> {
  const qs = buildQueryString({
    ...filters,
    pageSize: filters.pageSize ?? filters.limit
  } as Record<string, unknown>);

  if (token) {
    return apiRequest<PaginatedResponse<CustomerDTO>>(`/customers${qs}`, undefined, token);
  }

  return appFetch<PaginatedResponse<CustomerDTO>>(`/api/customers${qs}`);
}

export async function getCustomerById(id: string, token?: string): Promise<CustomerDTO> {
  if (token) {
    return apiRequest<CustomerDTO>(`/customers/${id}`, undefined, token);
  }
  return appFetch<CustomerDTO>(`/api/customers/${id}`);
}

export async function getCustomerLedger(
  id: string,
  filters: { page?: number; pageSize?: number } = {},
  token?: string
): Promise<CustomerLedgerDTO> {
  const qs = buildQueryString({
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 100
  });

  if (token) {
    return apiRequest<CustomerLedgerDTO>(`/customers/${id}/ledger${qs}`, undefined, token);
  }
  return appFetch<CustomerLedgerDTO>(`/api/customers/${id}/ledger${qs}`);
}

export async function getCustomerLedgerView(
  id: string,
  token?: string
): Promise<CustomerLedgerView> {
  const [customer, ledger] = await Promise.all([
    getCustomerById(id, token),
    getCustomerLedger(id, { page: 1, pageSize: 100 }, token)
  ]);

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    notes: customer.notes,
    openingBalance: ledger.openingBalance,
    udhar: ledger.balance,
    ledger: ledger.items.map((row) => ({
      id: row.id,
      date: row.date,
      type: row.type,
      reference: row.reference ?? null,
      status: row.status,
      label: row.reference ? `${row.type} ${row.reference}` : row.type,
      amount: row.delta,
      running_balance: row.balance
    }))
  };
}


export async function createCustomer(input: CreateCustomerInput): Promise<CustomerDTO> {
  return appFetch<CustomerDTO>('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput
): Promise<CustomerMutationResult> {
  return appFetch<CustomerMutationResult>(`/api/customers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function deactivateCustomer(id: string): Promise<CustomerMutationResult> {
  return updateCustomer(id, { isActive: false });
}

export async function reactivateCustomer(id: string): Promise<CustomerMutationResult> {
  return updateCustomer(id, { isActive: true });
}
