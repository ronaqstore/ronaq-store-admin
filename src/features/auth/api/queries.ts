import { queryOptions } from '@tanstack/react-query';
import { fetchAuthMe } from './service';
import type { AuthMeResponse } from '@/types/auth';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const
};

export function authMeQueryOptions() {
  return queryOptions<AuthMeResponse>({
    queryKey: authKeys.me(),
    queryFn: () => fetchAuthMe()
  });
}
