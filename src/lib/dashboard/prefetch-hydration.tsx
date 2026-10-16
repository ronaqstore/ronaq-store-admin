import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { auth } from '@/auth';
import { getQueryClient } from '@/lib/query-client';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import type { PrefetchHydrationBoundaryProps } from '@/types/dashboard';

export async function PrefetchHydrationBoundary({
  prefetch,
  children,
  fallback
}: PrefetchHydrationBoundaryProps) {
  const session = await auth();
  const token = session?.accessToken;
  const qc = getQueryClient();

  if (token) {
    await prefetch(token, qc);
  }

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={fallback ?? <DataTableSkeleton rowCount={5} columnCount={5} />}>
        {children}
      </Suspense>
    </HydrationBoundary>
  );
}
