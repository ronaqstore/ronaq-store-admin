'use client';

import { ChartSkeleton } from '@/components/dashboard/chart-skeleton';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';
import type { LazyChartSectionProps } from '@/types/charts';

export function PlatformLazyBlock({
  children,
  minHeight = 280,
  skeletonType = 'bar'
}: LazyChartSectionProps) {
  const { ref, inView } = useInView<HTMLDivElement>('200px');
  return (
    <div
      ref={ref}
      className={cn(
        !inView && 'min-h-[280px]',
        !inView && minHeight >= 360 && 'min-h-[360px]'
      )}
    >
      {inView ? (
        children
      ) : (
        <ChartSkeleton type={skeletonType} height={minHeight} />
      )}
    </div>
  );
}
