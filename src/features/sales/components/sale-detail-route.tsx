import { PrefetchHydrationBoundary } from '@/lib/dashboard/prefetch-hydration';
import { storeSettingsQueryOptions } from '@/features/store-settings';
import type { SalePrefetchRouteProps } from '@/types/dashboard';
import { saleQueryOptions } from '../api/queries';

export async function SalePrefetchRoute({ id, children }: SalePrefetchRouteProps) {
  return (
    <PrefetchHydrationBoundary
      prefetch={async (token, qc) => {
        await Promise.all([
          qc.prefetchQuery(saleQueryOptions(id, token)),
          qc.prefetchQuery(storeSettingsQueryOptions(token))
        ]);
      }}
    >
      {children}
    </PrefetchHydrationBoundary>
  );
}
