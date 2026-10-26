import {
  MutationCache,
  QueryCache,
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer
} from '@tanstack/react-query';
import { ApiError } from '@/lib/api/types';
import { signOutForUnauthorized } from '@/lib/auth/force-sign-out';

function handleAuthError(error: unknown) {
  if (typeof window === 'undefined') return;
  if (error instanceof ApiError && error.statusCode === 401) {
    void signOutForUnauthorized();
  }
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: handleAuthError
    }),
    mutationCache: new MutationCache({
      onError: handleAuthError
    }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchInterval: false,
        retry: false
      },
      dehydrate: {
        shouldDehydrateQuery: defaultShouldDehydrateQuery
      }
    }
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
