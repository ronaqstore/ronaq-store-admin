import { appFetch } from '@/lib/api/app-fetch';
import type { StaffUserDto, CreateStaffInput, UpdateStaffInput } from '@/lib/api/types';
import type { StaffListApiResult, StaffSingleApiResult, StaffActionApiResponse } from '@/types';

export async function listStaff(): Promise<StaffUserDto[]> {
  const res = await appFetch<StaffListApiResult>('/api/staff');
  if (Array.isArray(res)) return res;
  return res.data ?? [];
}

export async function createStaff(input: CreateStaffInput): Promise<StaffUserDto> {
  const res = await appFetch<StaffSingleApiResult>('/api/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if ('data' in res && res.data) return res.data;
  return res as StaffUserDto;
}

export async function updateStaff(id: string, input: UpdateStaffInput): Promise<StaffUserDto> {
  const res = await appFetch<StaffSingleApiResult>(`/api/staff/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if ('data' in res && res.data) return res.data;
  return res as StaffUserDto;
}

export async function deleteStaff(id: string): Promise<StaffActionApiResponse> {
  return appFetch<StaffActionApiResponse>(`/api/staff/${id}`, {
    method: 'DELETE'
  });
}
