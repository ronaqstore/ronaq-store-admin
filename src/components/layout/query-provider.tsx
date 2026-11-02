'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { QuerySyncListener } from '@/components/layout/query-sync-listener';
import type { QueryProviderProps } from '@/types';

export default function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <QuerySyncListener />
      {children}
    </QueryClientProvider>
  );
}
