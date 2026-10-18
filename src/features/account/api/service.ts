import { appFetch } from '@/lib/api/app-fetch';
import type { ChangePasswordInput } from '@/types';

export async function changePassword(input: ChangePasswordInput): Promise<unknown> {
  return appFetch<unknown>('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}
