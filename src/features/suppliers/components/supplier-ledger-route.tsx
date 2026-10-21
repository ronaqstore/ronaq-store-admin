import { PrefetchHydrationBoundary } from '@/lib/dashboard/prefetch-hydration';
import type { SupplierLedgerPrefetchRouteProps } from '@/types/dashboard';
import { supplierQueryOptions } from '@/features/dukaan/api/queries';
import { supplierPayableQueryOptions } from '@/features/supplier-payments/api/queries';

export async function SupplierLedgerPrefetchRoute({
  id,
  children
}: SupplierLedgerPrefetchRouteProps) {
  return (
    <PrefetchHydrationBoundary
      prefetch={async (token, qc) => {
        await Promise.all([
          qc.prefetchQuery(supplierQueryOptions(id, token)),
          qc.prefetchQuery(supplierPayableQueryOptions(id, token))
        ]);
      }}
    >
      {children}
    </PrefetchHydrationBoundary>
  );
}
