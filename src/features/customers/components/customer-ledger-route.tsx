import { PrefetchHydrationBoundary } from '@/lib/dashboard/prefetch-hydration';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import type { CustomerLedgerPrefetchRouteProps } from '@/types/dashboard';
import { customerQueryOptions } from '@/features/dukaan/api/queries';

export async function CustomerLedgerPrefetchRoute({
  id,
  children
}: CustomerLedgerPrefetchRouteProps) {
  return (
    <PrefetchHydrationBoundary
      prefetch={(token, qc) => qc.prefetchQuery(customerQueryOptions(id, token))}
      fallback={<DataTableSkeleton rowCount={6} columnCount={4} />}
    >
      {children}
    </PrefetchHydrationBoundary>
  );
}
