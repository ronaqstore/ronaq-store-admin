import { PrefetchHydrationBoundary } from '@/lib/dashboard/prefetch-hydration';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import type { CustomerLedgerPrefetchRouteProps } from '@/types/dashboard';
import { customerQueryOptions } from '@/features/dukaan/api/queries';
import { customerReceivableQueryOptions } from '@/features/payments/api/queries';

export async function CustomerLedgerPrefetchRoute({
  id,
  children
}: CustomerLedgerPrefetchRouteProps) {
  return (
    <PrefetchHydrationBoundary
      prefetch={async (token, qc) => {
        await Promise.all([
          qc.prefetchQuery(customerQueryOptions(id, token)),
          qc.prefetchQuery(customerReceivableQueryOptions(id, token))
        ]);
      }}
      fallback={<DataTableSkeleton rowCount={6} columnCount={4} />}
    >
      {children}
    </PrefetchHydrationBoundary>
  );
}
