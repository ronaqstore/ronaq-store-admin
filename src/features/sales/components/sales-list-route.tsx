import PageContainer from '@/components/layout/page-container';
import { PrefetchHydrationBoundary } from '@/lib/dashboard/prefetch-hydration';
import type { ListRouteOpenAddProps } from '@/types/dashboard';
import { salesQueryOptions } from '../api/queries';
import { SalesListClient } from './sales';

export async function SalesListRoute({ defaultOpenAdd = false }: ListRouteOpenAddProps) {
  return (
    <PageContainer fill pageTitle='pages.sales.title' pageDescription='pages.sales.description'>
      <PrefetchHydrationBoundary
        prefetch={(token, qc) =>
          qc.prefetchQuery(
            salesQueryOptions(
              { page: 1, pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' },
              token
            )
          )
        }
      >
        <SalesListClient defaultOpenAdd={defaultOpenAdd} />
      </PrefetchHydrationBoundary>
    </PageContainer>
  );
}
