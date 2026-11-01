import PageContainer from '@/components/layout/page-container';
import { PrefetchHydrationBoundary } from '@/lib/dashboard/prefetch-hydration';
import type { ListRouteOpenAddProps } from '@/types/dashboard';
import { consignmentsQueryOptions } from '../api/queries';
import { ConsignmentsListClient } from './consignments';

export async function ConsignmentsListRoute({ defaultOpenAdd = false }: ListRouteOpenAddProps) {
  return (
    <PageContainer
      fill
      pageTitle='pages.consignments.title'
      pageDescription='pages.consignments.description'
    >
      <PrefetchHydrationBoundary
        prefetch={(token, qc) =>
          qc.prefetchQuery(consignmentsQueryOptions({ page: 1, pageSize: 20 }, token))
        }
      >
        <ConsignmentsListClient defaultOpenAdd={defaultOpenAdd} />
      </PrefetchHydrationBoundary>
    </PageContainer>
  );
}
