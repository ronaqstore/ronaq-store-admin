'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBuildingStore,
  IconCash,
  IconClock,
} from '@tabler/icons-react';
import { ChartCard } from '@/components/dashboard/chart-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import {
  formatNumber,
  formatPkrCompact,
  formatPkrFull,
} from '@/lib/dashboard/formatters';
import {
  shopAttentionQueryOptions,
  shopExpensesByCategoryQueryOptions,
  shopInventoryAgingQueryOptions,
} from '../api/queries';
import { useT } from '@/i18n/use-t';
import type { DashboardRow5Props } from '@/types/dashboard';

const EXPENSE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'hsl(var(--destructive))',
  'hsl(var(--muted-foreground))',
];

const EXPENSE_BG_CLASSES = [
  'bg-[var(--chart-1)]',
  'bg-[var(--chart-2)]',
  'bg-[var(--chart-3)]',
  'bg-[var(--chart-4)]',
  'bg-[var(--chart-5)]',
  'bg-[hsl(var(--destructive))]',
  'bg-muted-foreground',
];

export function DashboardRow5ExpensesInventory({ params }: DashboardRow5Props) {
  const t = useT();

  const {
    data: expenses,
    isLoading: isExpensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useQuery(shopExpensesByCategoryQueryOptions(params));

  const {
    data: invAging,
    isLoading: isInvLoading,
    error: invError,
    refetch: refetchInv,
  } = useQuery(shopInventoryAgingQueryOptions());

  const {
    data: attention,
    isLoading: isAttentionLoading,
    error: attentionError,
    refetch: refetchAttention,
  } = useQuery(shopAttentionQueryOptions());

  const expenseCategories = expenses?.categories ?? [];
  const expenseChartData = expenseCategories.map((c) => ({
    name: c.name,
    amount: c.amount,
    percentage: c.percentage,
  }));

  const expenseTableColumns = [
    { key: 'name', label: t('dashboard.metrics.category') },
    { key: 'formattedAmount', label: t('dashboard.metrics.amount'), align: 'right' as const },
    { key: 'percentage', label: t('dashboard.metrics.share'), align: 'right' as const },
  ];

  const expenseTableRows = expenseCategories.map((c) => ({
    name: c.name,
    formattedAmount: formatPkrFull(c.amount),
    percentage: `${c.percentage}%`,
  }));

  const agingBuckets = invAging?.agingBuckets ?? [];
  const conditionSplit = invAging?.conditionSplit;

  const invChartData = agingBuckets.map((b) => ({
    label: b.label,
    bucketKey: b.bucket,
    count: b.count,
    costValue: b.costValue,
  }));

  const invTableColumns = [
    { key: 'label', label: t('dashboard.metrics.bucket') },
    { key: 'count', label: t('dashboard.metrics.units'), align: 'right' as const },
    { key: 'formattedCost', label: t('dashboard.metrics.costOfGoods'), align: 'right' as const },
  ];

  const invTableRows = agingBuckets.map((b) => ({
    label: b.label,
    count: b.count,
    formattedCost: formatPkrFull(b.costValue),
  }));

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
      <div className='lg:col-span-4'>
        <ChartCard
          title={t('dashboard.expensesByCategoryTitle')}
          tooltip={t('dashboard.expensesByCategoryTooltip')}
          isLoading={isExpensesLoading}
          error={expensesError as Error}
          onRetry={refetchExpenses}
          isEmpty={expenseCategories.length === 0}
          skeletonType='donut'
          tableColumns={expenseTableColumns}
          tableRows={expenseTableRows}
          csvFilename='expenses-by-category'
        >
          <div className='flex flex-col gap-3'>
            <ResponsiveContainer width='100%' height={190}>
              <PieChart>
                <Pie
                  data={expenseChartData}
                  cx='50%'
                  cy='50%'
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey='amount'
                >
                  {expenseChartData.map((_, idx) => (
                    <Cell key={idx} fill={EXPENSE_COLORS[idx % EXPENSE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    return (
                      <div className='rounded-lg border bg-background p-2.5 shadow-md text-xs'>
                        <div className='font-semibold text-foreground'>{data.name}</div>
                        <div className='mt-1 flex items-center justify-between gap-4'>
                          <span className='text-muted-foreground'>{t('dashboard.metrics.amount')}:</span>
                          <span className='font-semibold text-foreground'>{formatPkrFull(data.amount)}</span>
                        </div>
                        <div className='flex items-center justify-between gap-4'>
                          <span className='text-muted-foreground'>{t('dashboard.metrics.share')}:</span>
                          <span className='font-medium text-foreground'>{data.percentage}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className='flex flex-col gap-1.5'>
              {expenseCategories.slice(0, 4).map((c, idx) => (
                <div key={c.categoryId} className='flex items-center justify-between text-xs'>
                  <div className='flex items-center gap-2 truncate'>
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${EXPENSE_BG_CLASSES[idx % EXPENSE_BG_CLASSES.length]}`}
                    />
                    <span className='text-muted-foreground truncate'>{c.name}</span>
                  </div>
                  <span className='font-medium text-foreground tabular-nums shrink-0'>
                    {formatPkrCompact(c.amount)} ({c.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <div className='lg:col-span-4'>
        <ChartCard
          title={t('dashboard.inventoryAgingTitle')}
          tooltip={t('dashboard.inventoryAgingTooltip')}
          isLoading={isInvLoading}
          error={invError as Error}
          onRetry={refetchInv}
          isEmpty={agingBuckets.length === 0}
          skeletonType='bar'
          tableColumns={invTableColumns}
          tableRows={invTableRows}
          csvFilename='inventory-aging'
        >
          <div className='flex flex-col gap-3'>
            {conditionSplit ? (
              <div className='grid grid-cols-2 gap-2 border-b pb-2 text-xs'>
                <div className='rounded bg-muted/40 p-2'>
                  <div className='text-muted-foreground'>{t('dashboard.newPhones', { count: conditionSplit.newCount })}</div>
                  <div className='font-bold tabular-nums'>{formatPkrCompact(conditionSplit.newCostValue)}</div>
                </div>
                <div className='rounded bg-muted/40 p-2'>
                  <div className='text-muted-foreground'>{t('dashboard.usedPhones', { count: conditionSplit.usedCount })}</div>
                  <div className='font-bold tabular-nums'>{formatPkrCompact(conditionSplit.usedCostValue)}</div>
                </div>
              </div>
            ) : null}

            <ResponsiveContainer width='100%' height={210}>
              <ComposedChart data={invChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 3' className='stroke-muted/40' />
                <XAxis dataKey='label' className='text-[10px]' tickLine={false} />
                <YAxis className='text-xs' tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    return (
                      <div className='rounded-lg border bg-background p-2.5 shadow-md text-xs'>
                        <div className='font-semibold text-foreground'>{data.label}</div>
                        <div className='mt-1 flex items-center justify-between gap-4'>
                          <span className='text-muted-foreground'>{t('dashboard.metrics.units')}:</span>
                          <span className='font-semibold text-foreground'>{formatNumber(data.count)}</span>
                        </div>
                        <div className='flex items-center justify-between gap-4'>
                          <span className='text-muted-foreground'>{t('dashboard.metrics.costOfGoods')}:</span>
                          <span className='font-medium text-foreground'>{formatPkrFull(data.costValue)}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey='count' radius={[4, 4, 0, 0]} maxBarSize={30}>
                  {invChartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.bucketKey === '61-90' || entry.bucketKey === '90+' ? '#ef4444' : 'var(--chart-1)'}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className='lg:col-span-4'>
        <Card
          className='flex h-full flex-col'
          aria-label={t('dashboard.attentionTitle')}
        >
          <CardHeader className='pb-2'>
            <div className='flex items-center gap-2'>
              <IconAlertTriangle className='h-4 w-4 text-amber-500' />
              <CardTitle className='text-base font-semibold'>
                {t('dashboard.attentionTitle')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className='flex flex-1 flex-col gap-3 pt-2 text-xs'>
            {attentionError ? (
              <div className='flex flex-col items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3'>
                <p className='text-destructive text-xs'>
                  {attentionError instanceof Error
                    ? attentionError.message
                    : t('dashboard.retry')}
                </p>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() => void refetchAttention()}
                >
                  {t('dashboard.retry')}
                </Button>
              </div>
            ) : isAttentionLoading || !attention ? (
              <div className='flex flex-col gap-2'>
                <div className='h-12 animate-pulse rounded bg-muted/40' />
                <div className='h-12 animate-pulse rounded bg-muted/40' />
                <div className='h-12 animate-pulse rounded bg-muted/40' />
              </div>
            ) : (
              <>
                <div className='flex flex-col gap-1 rounded-lg border border-amber-200/50 bg-amber-50/30 p-2.5 dark:border-amber-950 dark:bg-amber-950/20'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300'>
                      <IconClock className='h-3.5 w-3.5' />
                      <span>{t('dashboard.customerUdhar')} ({attention.overdueUdhar.count})</span>
                    </div>
                    <span className='font-bold tabular-nums text-amber-900 dark:text-amber-200'>
                      {formatPkrCompact(attention.overdueUdhar.totalAmount)}
                    </span>
                  </div>
                  <Link
                    href='/dashboard/customers'
                    className='text-[11px] text-amber-700 hover:underline dark:text-amber-400 mt-1 inline-flex items-center gap-1'
                  >
                    <span>{t('dashboard.actions.viewCustomers')}</span>
                    <IconArrowRight className='h-3 w-3' />
                  </Link>
                </div>

                <div className='flex flex-col gap-1 rounded-lg border p-2.5'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-1.5 font-semibold'>
                      <IconBuildingStore className='h-3.5 w-3.5 text-muted-foreground' />
                      <span>{t('dashboard.lowStock')} ({attention.lowStock.length})</span>
                    </div>
                  </div>
                  {attention.lowStock.slice(0, 2).map((item) => (
                    <div key={item.productId} className='flex items-center justify-between text-[11px] text-muted-foreground'>
                      <span className='truncate'>{item.name}</span>
                      <span className='tabular-nums text-rose-600 dark:text-rose-400 font-medium'>
                        {item.currentStock} / {item.threshold}
                      </span>
                    </div>
                  ))}
                  <Link
                    href='/dashboard/products'
                    className='text-[11px] text-primary hover:underline mt-1 inline-flex items-center gap-1'
                  >
                    <span>{t('dashboard.actions.orderStock')}</span>
                    <IconArrowRight className='h-3 w-3' />
                  </Link>
                </div>

                {attention.cashReconciliationDifference ? (
                  <div className='flex flex-col gap-1 rounded-lg border border-rose-200 bg-rose-50/30 p-2.5 dark:border-rose-950 dark:bg-rose-950/20'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-1.5 font-semibold text-rose-800 dark:text-rose-300'>
                        <IconCash className='h-3.5 w-3.5' />
                        <span>{t('dashboard.cashDiff')}</span>
                      </div>
                      <span className='font-bold tabular-nums text-rose-900 dark:text-rose-200'>
                        {formatPkrFull(attention.cashReconciliationDifference.difference)}
                      </span>
                    </div>
                    <span className='text-[10px] text-rose-600 dark:text-rose-400'>
                      {attention.cashReconciliationDifference.reason}
                    </span>
                  </div>
                ) : null}

                {attention.subscriptionDaysLeft !== null ? (
                  <div className='flex items-center justify-between rounded-lg border p-2.5 bg-muted/40'>
                    <span className='text-muted-foreground'>{t('dashboard.subscription')}</span>
                    <Badge variant='outline' className='text-[10px]'>
                      {t('dashboard.daysLeft', { count: attention.subscriptionDaysLeft })}
                    </Badge>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
