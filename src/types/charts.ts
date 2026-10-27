import type { ReactNode } from 'react';
import type { MessageKey } from '@/i18n/messages/en';

export type ChartSkeletonType =
  | 'kpi'
  | 'bar'
  | 'line'
  | 'donut'
  | 'waterfall'
  | 'horizontal-bar'
  | 'composed'
  | 'list'
  | 'funnel'
  | 'table'
  | 'row-sales-profit'
  | 'row-cash-udhar'
  | 'row-products-mix'
  | 'row-expenses-attention'
  | 'row-platform-renewals'
  | 'row-platform-activity'
  | 'row-platform-risk';

export interface ChartSkeletonProps {
  type?: ChartSkeletonType;
  height?: number;
}

export interface ChartSkeletonFrameProps {
  height: number;
  className?: string;
  children: ReactNode;
}

export interface ChartSkeletonShellProps {
  children: ReactNode;
}

export interface ChartSkeletonHeightProps {
  height: number;
}

export interface EmptyChartProps {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}

export interface ChartTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
}

export interface ChartTableRow {
  [key: string]: string | number;
}

export interface ChartMetricOption {
  key: string;
  label: string;
}

export interface ChartCardProps {
  title: string;
  description?: string;
  tooltip?: string;
  periodLabel?: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
  skeletonType?: Exclude<
    ChartSkeletonType,
    | 'kpi'
    | 'row-sales-profit'
    | 'row-cash-udhar'
    | 'row-products-mix'
    | 'row-expenses-attention'
    | 'row-platform-renewals'
    | 'row-platform-activity'
    | 'row-platform-risk'
  >;
  height?: number;
  metrics?: ChartMetricOption[];
  selectedMetric?: string;
  onSelectMetric?: (metric: string) => void;
  tableColumns?: ChartTableColumn[];
  tableRows?: ChartTableRow[];
  csvFilename?: string;
  children: ReactNode;
}

export interface KpiCardChange {
  percentage: number;
  absolute?: number;
  isInverse?: boolean;
}

export interface MiniSparklineProps {
  points: number[];
  color?: string;
}

export interface KpiCardProps {
  label: string;
  value: string;
  tooltip?: string;
  change?: KpiCardChange;
  sparkline?: number[];
  sparklineColor?: string;
  href?: string;
  className?: string;
}

export type DashboardPeriod =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface DateRangeFilterProps {
  currentPeriod?: string;
  compare?: boolean;
  onPeriodChange?: (period: DashboardPeriod) => void;
  onCompareChange?: (compare: boolean) => void;
  className?: string;
}

export interface DateRangePeriodOption {
  key: DashboardPeriod;
  labelKey: MessageKey;
}

export interface DashboardCustomDateRange {
  from: string;
  to: string;
}

export interface LazyChartSectionProps {
  children: ReactNode;
  minHeight?: number;
  skeletonType?: ChartSkeletonType;
}
