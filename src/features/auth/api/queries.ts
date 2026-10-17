import { queryOptions } from '@tanstack/react-query';
import { fetchAuthMe } from './service';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const
};

export function authMeQueryOptions() {
  return queryOptions({
    queryKey: authKeys.me(),
    queryFn: () => fetchAuthMe()
  });
}
