'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateDomainsQuiet } from '@/lib/query/invalidate-domains';
import { subscribeQuerySyncInvalidate } from '@/lib/query/query-sync-channel';

export function QuerySyncListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return subscribeQuerySyncInvalidate((domains) => {
      invalidateDomainsQuiet(queryClient, domains);
    });
  }, [queryClient]);

  return null;
}
