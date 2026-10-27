import PageContainer from '@/components/layout/page-container';
import { DukaanDashboard } from '@/features/dukaan/components/dashboard';
import { shopKpisQueryOptions } from '@/features/dukaan/api/queries';
import { getQueryClient } from '@/lib/query-client';
import { auth } from '@/auth';
import { PLATFORM_HOME } from '@/lib/auth/routes';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('overview')
  };
}

function DashboardSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className='h-28 rounded-xl' />
      ))}
    </div>
  );
}

export default async function OverviewPage() {
  const session = await auth();
  if (session?.user?.role === 'SUPER_ADMIN') {
    redirect(PLATFORM_HOME);
  }

  const queryClient = getQueryClient();
  const token = session?.accessToken;

  if (token) {
    await queryClient.prefetchQuery(shopKpisQueryOptions({ period: '7d' }, token));
  }

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<DashboardSkeleton />}>
          <DukaanDashboard />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
