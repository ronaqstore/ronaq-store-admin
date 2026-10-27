'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type {
  ChartSkeletonFrameProps,
  ChartSkeletonHeightProps,
  ChartSkeletonProps,
  ChartSkeletonShellProps,
  ChartSkeletonType,
} from '@/types/charts';

const BAR_HEIGHTS = [40, 70, 55, 85, 60, 45, 90, 50, 75, 65];
const HBAR_WIDTHS = [88, 72, 64, 52, 40, 34, 28];
const FUNNEL_WIDTHS = [100, 82, 70, 55, 42, 30];

function ChartFrame({ height, className, children }: ChartSkeletonFrameProps) {
  return (
    <div
      className={cn('w-full overflow-hidden p-4', className)}
      style={{ height }}
    >
      {children}
    </div>
  );
}

function CardShell({ children }: ChartSkeletonShellProps) {
  return (
    <div className='bg-card flex flex-col overflow-hidden rounded-lg border'>
      <div className='flex items-center justify-between gap-3 border-b px-4 py-3'>
        <Skeleton className='h-4 w-36' />
        <Skeleton className='h-7 w-24' />
      </div>
      {children}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className='flex flex-col gap-3 p-1'>
      <Skeleton className='h-3.5 w-28' />
      <Skeleton className='h-8 w-32' />
      <div className='mt-1 flex items-end justify-between gap-3'>
        <Skeleton className='h-5 w-16 rounded-full' />
        <Skeleton className='h-7 w-20' />
      </div>
    </div>
  );
}

function BarSkeleton({ height }: ChartSkeletonHeightProps) {
  return (
    <ChartFrame height={height} className='flex items-end justify-between gap-2'>
      {BAR_HEIGHTS.map((h, i) => (
        <Skeleton
          key={i}
          className='w-7 rounded-t-md sm:w-8'
          style={{ height: `${h}%` }}
        />
      ))}
    </ChartFrame>
  );
}

function LineSkeleton({ height }: ChartSkeletonHeightProps) {
  return (
    <ChartFrame
      height={height}
      className='relative flex flex-col justify-end gap-3'
    >
      <div className='flex flex-1 items-end justify-between gap-2 pt-6'>
        {BAR_HEIGHTS.map((h, i) => (
          <div key={i} className='flex h-full flex-1 flex-col justify-end'>
            <Skeleton
              className='w-full max-w-10 rounded-t-sm opacity-70'
              style={{ height: `${Math.max(18, h - 15)}%` }}
            />
          </div>
        ))}
      </div>
      <Skeleton className='h-1 w-full rounded-full' />
      <div className='absolute inset-x-8 top-10'>
        <Skeleton className='h-1 w-full rounded-full opacity-60' />
      </div>
    </ChartFrame>
  );
}

function ComposedSkeleton({ height }: ChartSkeletonHeightProps) {
  return (
    <ChartFrame
      height={height}
      className='relative flex items-end justify-between gap-1.5'
    >
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className='flex h-full flex-1 flex-col items-center justify-end gap-1'
        >
          <Skeleton
            className='w-2/3 max-w-6 rounded-t-sm'
            style={{ height: `${h}%` }}
          />
        </div>
      ))}
      <div className='pointer-events-none absolute inset-x-6 top-[28%]'>
        <Skeleton className='h-1 w-full rounded-full' />
      </div>
    </ChartFrame>
  );
}

function DonutSkeleton({ height }: ChartSkeletonHeightProps) {
  return (
    <ChartFrame
      height={height}
      className='flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8'
    >
      <Skeleton className='size-36 shrink-0 rounded-full sm:size-44' />
      <div className='flex w-full max-w-40 flex-col gap-2.5'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <Skeleton className='size-2.5 rounded-full' />
              <Skeleton className='h-3 w-20' />
            </div>
            <Skeleton className='h-3 w-8' />
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}

function WaterfallSkeleton({ height }: ChartSkeletonHeightProps) {
  const steps = [78, 28, 48, 36, 58];
  return (
    <ChartFrame
      height={height}
      className='flex items-end justify-between gap-3 px-6'
    >
      {steps.map((h, i) => (
        <Skeleton
          key={i}
          className='w-12 rounded-t-md sm:w-14'
          style={{ height: `${h}%` }}
        />
      ))}
    </ChartFrame>
  );
}

function HorizontalBarSkeleton({ height }: ChartSkeletonHeightProps) {
  return (
    <ChartFrame height={height} className='flex flex-col justify-center gap-3'>
      {HBAR_WIDTHS.map((w, i) => (
        <div key={i} className='flex items-center gap-3'>
          <Skeleton className='h-3 w-20 shrink-0 sm:w-28' />
          <Skeleton className='h-4 rounded-md' style={{ width: `${w}%` }} />
        </div>
      ))}
    </ChartFrame>
  );
}

function ListSkeleton({ height }: ChartSkeletonHeightProps) {
  return (
    <ChartFrame height={height} className='flex flex-col gap-2.5'>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className='flex items-center justify-between gap-3 rounded-md border p-2.5'
        >
          <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
            <Skeleton className='h-3.5 w-2/3' />
            <Skeleton className='h-3 w-1/3' />
          </div>
          <Skeleton className='h-7 w-7 shrink-0 rounded-md' />
        </div>
      ))}
    </ChartFrame>
  );
}

function FunnelSkeleton({ height }: ChartSkeletonHeightProps) {
  return (
    <ChartFrame height={height} className='flex flex-col justify-center gap-3'>
      {FUNNEL_WIDTHS.map((w, i) => (
        <div key={i} className='space-y-1.5'>
          <div className='flex items-center justify-between gap-2'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-3 w-10' />
          </div>
          <Skeleton className='h-2.5 rounded-full' style={{ width: `${w}%` }} />
        </div>
      ))}
    </ChartFrame>
  );
}

function TableSkeleton({ height }: ChartSkeletonHeightProps) {
  return (
    <ChartFrame height={height} className='flex flex-col gap-2'>
      <div className='grid grid-cols-5 gap-2 border-b pb-2'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-3 w-full' />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, row) => (
        <div key={row} className='grid grid-cols-5 gap-2 py-1.5'>
          {Array.from({ length: 5 }).map((_, col) => (
            <Skeleton key={col} className='h-3.5 w-full' />
          ))}
        </div>
      ))}
    </ChartFrame>
  );
}

function renderSingle(type: ChartSkeletonType, height: number) {
  switch (type) {
    case 'kpi':
      return <KpiSkeleton />;
    case 'line':
      return <LineSkeleton height={height} />;
    case 'donut':
      return <DonutSkeleton height={height} />;
    case 'waterfall':
      return <WaterfallSkeleton height={height} />;
    case 'horizontal-bar':
      return <HorizontalBarSkeleton height={height} />;
    case 'composed':
      return <ComposedSkeleton height={height} />;
    case 'list':
      return <ListSkeleton height={height} />;
    case 'funnel':
      return <FunnelSkeleton height={height} />;
    case 'table':
      return <TableSkeleton height={height} />;
    case 'bar':
    default:
      return <BarSkeleton height={height} />;
  }
}

function RowSalesProfitSkeleton({ height }: ChartSkeletonHeightProps) {
  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
      <div className='lg:col-span-7'>
        <CardShell>{renderSingle('line', height)}</CardShell>
      </div>
      <div className='lg:col-span-5'>
        <CardShell>{renderSingle('waterfall', height)}</CardShell>
      </div>
    </div>
  );
}

function RowCashUdharSkeleton({ height }: ChartSkeletonHeightProps) {
  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
      <CardShell>{renderSingle('composed', height)}</CardShell>
      <CardShell>{renderSingle('horizontal-bar', height)}</CardShell>
    </div>
  );
}

function RowProductsMixSkeleton({ height }: ChartSkeletonHeightProps) {
  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
      <CardShell>{renderSingle('horizontal-bar', height)}</CardShell>
      <CardShell>{renderSingle('donut', height)}</CardShell>
    </div>
  );
}

function RowExpensesAttentionSkeleton({ height }: ChartSkeletonHeightProps) {
  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
      <div className='lg:col-span-4'>
        <CardShell>{renderSingle('donut', height)}</CardShell>
      </div>
      <div className='lg:col-span-4'>
        <CardShell>{renderSingle('bar', height)}</CardShell>
      </div>
      <div className='lg:col-span-4'>
        <CardShell>{renderSingle('list', height)}</CardShell>
      </div>
    </div>
  );
}

function RowPlatformRenewalsSkeleton({ height }: ChartSkeletonHeightProps) {
  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
      <CardShell>{renderSingle('bar', height)}</CardShell>
      <CardShell>{renderSingle('list', height)}</CardShell>
    </div>
  );
}

function RowPlatformActivitySkeleton({ height }: ChartSkeletonHeightProps) {
  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
      <CardShell>{renderSingle('list', height)}</CardShell>
      <div className='lg:col-span-2'>
        <CardShell>{renderSingle('line', height)}</CardShell>
      </div>
    </div>
  );
}

function RowPlatformRiskSkeleton({ height }: ChartSkeletonHeightProps) {
  return <CardShell>{renderSingle('table', height)}</CardShell>;
}

export function ChartSkeleton({
  type = 'bar',
  height = 280,
}: ChartSkeletonProps) {
  switch (type) {
    case 'row-sales-profit':
      return <RowSalesProfitSkeleton height={height} />;
    case 'row-cash-udhar':
      return <RowCashUdharSkeleton height={height} />;
    case 'row-products-mix':
      return <RowProductsMixSkeleton height={height} />;
    case 'row-expenses-attention':
      return <RowExpensesAttentionSkeleton height={height} />;
    case 'row-platform-renewals':
      return <RowPlatformRenewalsSkeleton height={height} />;
    case 'row-platform-activity':
      return <RowPlatformActivitySkeleton height={height} />;
    case 'row-platform-risk':
      return <RowPlatformRiskSkeleton height={height} />;
    default:
      return renderSingle(type, height);
  }
}
