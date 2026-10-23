import PageContainer from '@/components/layout/page-container';
import { PrefetchHydrationBoundary } from '@/lib/dashboard/prefetch-hydration';
import type { AdjustmentsRouteShellProps } from '@/types/dashboard';
import { inventoryAdjustmentsQueryOptions } from '../api/queries';
import { InventoryMovementsClient, StockAdjustmentsClient } from './inventory';

const ADJUSTMENTS_FILTERS = {
  page: 1,
  pageSize: 20,
  scope: 'manual' as const,
  sortBy: 'createdAt' as const,
  sortOrder: 'desc' as const
};

const MOVEMENTS_FILTERS = {
  page: 1,
  pageSize: 20,
  scope: 'all' as const,
  sortBy: 'createdAt' as const,
  sortOrder: 'desc' as const
};

async function AdjustmentsRouteShell({
  pageTitle,
  pageDescription,
  children,
  filters
}: AdjustmentsRouteShellProps) {
  return (
    <PageContainer fill pageTitle={pageTitle} pageDescription={pageDescription}>
      <PrefetchHydrationBoundary
        prefetch={(token, qc) =>
          qc.prefetchQuery(inventoryAdjustmentsQueryOptions(filters, token))
        }
      >
        {children}
      </PrefetchHydrationBoundary>
    </PageContainer>
  );
}

export async function StockAdjustmentsRoute() {
  return (
    <AdjustmentsRouteShell
      pageTitle='pages.adjustments.title'
      pageDescription='pages.adjustments.description'
      filters={ADJUSTMENTS_FILTERS}
    >
      <StockAdjustmentsClient />
    </AdjustmentsRouteShell>
  );
}

export async function InventoryMovementsRoute() {
  return (
    <AdjustmentsRouteShell
      pageTitle='pages.movements.title'
      pageDescription='pages.movements.description'
      filters={MOVEMENTS_FILTERS}
    >
      <InventoryMovementsClient />
    </AdjustmentsRouteShell>
  );
}
