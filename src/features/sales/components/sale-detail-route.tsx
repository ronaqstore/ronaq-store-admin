import { PrefetchHydrationBoundary } from '@/lib/dashboard/prefetch-hydration';
import type { SalePrefetchRouteProps } from '@/types/dashboard';
import { saleQueryOptions } from '../api/queries';

export async function SalePrefetchRoute({ id, children }: SalePrefetchRouteProps) {
  return (
    <PrefetchHydrationBoundary
      prefetch={(token, qc) => qc.prefetchQuery(saleQueryOptions(id, token))}
    >
      {children}
    </PrefetchHydrationBoundary>
  );
}
