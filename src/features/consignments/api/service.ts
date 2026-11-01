import { apiRequest } from '@/lib/api/client';
import { appFetch } from '@/lib/api/app-fetch';
import type {
  ConsignmentDTO,
  ConsignmentListFilters,
  CreateConsignmentInput,
  PaginatedResponse,
  ReturnConsignmentInput,
  SettleConsignmentInput,
  CancelConsignmentInput
} from '@/lib/api/types';
import type { OverdraftPrompt } from '@/types';
import { buildQueryString } from '@/lib/api/query-params';

export type SettleConsignmentResult =
  | ConsignmentDTO
  | (OverdraftPrompt & { confirmOverdraft?: boolean });

export async function listConsignments(
  filters: ConsignmentListFilters = {},
  token?: string
): Promise<PaginatedResponse<ConsignmentDTO>> {
  const qs = buildQueryString({
    ...filters
  } as Record<string, unknown>);

  if (token) {
    return apiRequest<PaginatedResponse<ConsignmentDTO>>(`/consignments${qs}`, undefined, token);
  }

  return appFetch<PaginatedResponse<ConsignmentDTO>>(`/api/consignments${qs}`);
}

export async function createConsignment(input: CreateConsignmentInput): Promise<ConsignmentDTO> {
  return appFetch<ConsignmentDTO>('/api/consignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function returnConsignment(
  id: string,
  input: ReturnConsignmentInput
): Promise<ConsignmentDTO> {
  return appFetch<ConsignmentDTO>(`/api/consignments/${id}/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function settleConsignment(
  id: string,
  input: SettleConsignmentInput
): Promise<SettleConsignmentResult> {
  return appFetch<SettleConsignmentResult>(`/api/consignments/${id}/settle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function cancelConsignment(
  id: string,
  input: CancelConsignmentInput
): Promise<ConsignmentDTO> {
  return appFetch<ConsignmentDTO>(`/api/consignments/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}
