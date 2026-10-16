import PageContainer from '@/components/layout/page-container';
import { PrefetchHydrationBoundary } from '@/lib/dashboard/prefetch-hydration';
import type { ListRouteOpenAddProps } from '@/types/dashboard';
import { purchasesQueryOptions } from '../api/queries';
import { PurchasesListClient } from './purchases';

export async function PurchasesListRoute({
  defaultOpenAdd = false
}: ListRouteOpenAddProps) {
  return (
    <PageContainer
      fill
      pageTitle='pages.purchases.title'
      pageDescription='pages.purchases.description'
    >
      <PrefetchHydrationBoundary
        prefetch={(token, qc) =>
          qc.prefetchQuery(
            purchasesQueryOptions(
              { page: 1, pageSize: 20, sortBy: 'purchaseDate', sortOrder: 'desc' },
              token
            )
          )
        }
      >
        <PurchasesListClient defaultOpenAdd={defaultOpenAdd} />
      </PrefetchHydrationBoundary>
    </PageContainer>
  );
}
