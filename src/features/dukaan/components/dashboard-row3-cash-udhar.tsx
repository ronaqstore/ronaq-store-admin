'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import { ChartCard } from '@/components/dashboard/chart-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  formatDateLabel,
  formatNumber,
  formatPkrCompact,
  formatPkrFull,
} from '@/lib/dashboard/formatters';
import {
  shopCashFlowQueryOptions,
  shopReceivablesAgingQueryOptions,
} from '../api/queries';
import { whatsappReminderUrl } from '@/constants/api';
import { useT } from '@/i18n/use-t';
import type { DashboardRow3Props } from '@/types/dashboard';

export function DashboardRow3CashUdhar({ params }: DashboardRow3Props) {
  const t = useT();

  const {
    data: cashFlow,
    isLoading: isCashLoading,
    error: cashError,
    refetch: refetchCash,
  } = useQuery(shopCashFlowQueryOptions(params));

  const {
    data: aging,
    isLoading: isAgingLoading,
    error: agingError,
    refetch: refetchAging,
  } = useQuery(shopReceivablesAgingQueryOptions());

  const cashSeries = cashFlow?.series ?? [];
  const cashChartData = cashSeries.map((item) => ({
    displayDate: formatDateLabel(item.date),
    cashIn: item.cashIn,
    cashOut: item.cashOut,
    netChange: item.netChange,
    closingBalance: item.closingBalance,
  }));

  const cashTableColumns = [
    { key: 'displayDate', label: t('dashboard.metrics.date') },
    { key: 'formattedIn', label: t('dashboard.metrics.cashIn'), align: 'right' as const },
    { key: 'formattedOut', label: t('dashboard.metrics.cashOut'), align: 'right' as const },
    { key: 'formattedNet', label: t('dashboard.metrics.netChange'), align: 'right' as const },
    { key: 'formattedClosing', label: t('dashboard.metrics.closingBalance'), align: 'right' as const },
  ];

  const cashTableRows = cashSeries.map((item) => ({
    displayDate: formatDateLabel(item.date),
    formattedIn: formatPkrFull(item.cashIn),
    formattedOut: formatPkrFull(item.cashOut),
    formattedNet: formatPkrFull(item.netChange),
    formattedClosing: formatPkrFull(item.closingBalance),
  }));

  const agingBuckets = aging?.buckets ?? [];
  const topDebtors = aging?.topDebtors ?? [];

  const agingChartData = agingBuckets.map((b) => ({
    label: b.label,
    bucketKey: b.bucket,
    amount: b.amount,
    customerCount: b.customerCount,
  }));

  const agingTableColumns = [
    { key: 'label', label: t('dashboard.metrics.bucket') },
    { key: 'formattedAmount', label: t('dashboard.metrics.amount'), align: 'right' as const },
    { key: 'customerCount', label: t('dashboard.metrics.customer'), align: 'right' as const },
  ];

  const agingTableRows = agingBuckets.map((b) => ({
    label: b.label,
    formattedAmount: formatPkrFull(b.amount),
    customerCount: formatNumber(b.customerCount),
  }));

  const handleWhatsApp = (phone: string, name: string, amount: number) => {
    const formattedAmt = formatPkrFull(amount);
    const text = `Assalam-o-Alaikum ${name}, this is a gentle reminder regarding your outstanding store Udhar balance of ${formattedAmt}. Please arrange payment at your earliest convenience. Shukriya!`;
    window.open(whatsappReminderUrl(phone, text), '_blank');
  };

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
      <ChartCard
        title={t('dashboard.cashFlowTitle')}
        tooltip={t('dashboard.cashFlowTooltip')}
        isLoading={isCashLoading}
        error={cashError as Error}
        onRetry={refetchCash}
        isEmpty={cashSeries.length === 0}
        skeletonType='composed'
        tableColumns={cashTableColumns}
        tableRows={cashTableRows}
        csvFilename='cash-flow'
      >
        <ResponsiveContainer width='100%' height={320}>
          <ComposedChart data={cashChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' className='stroke-muted/40' />
            <XAxis dataKey='displayDate' className='text-xs' tickLine={false} />
            <YAxis
              tickFormatter={(val: number) => formatPkrCompact(val)}
              className='text-xs'
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const data = payload[0].payload;
                return (
                  <div className='rounded-lg border bg-background p-2.5 shadow-md text-xs'>
                    <div className='font-semibold text-foreground'>{data.displayDate}</div>
                    <div className='mt-1.5 flex flex-col gap-1'>
                      <div className='flex items-center justify-between gap-4'>
                        <span className='text-emerald-600 dark:text-emerald-400'>{t('dashboard.metrics.cashIn')}:</span>
                        <span className='font-medium text-foreground'>{formatPkrFull(data.cashIn)}</span>
                      </div>
                      <div className='flex items-center justify-between gap-4'>
                        <span className='text-rose-600 dark:text-rose-400'>{t('dashboard.metrics.cashOut')}:</span>
                        <span className='font-medium text-foreground'>{formatPkrFull(data.cashOut)}</span>
                      </div>
                      <div className='flex items-center justify-between gap-4 pt-1 border-t'>
                        <span className='text-muted-foreground'>{t('dashboard.metrics.closingBalance')}:</span>
                        <span className='font-semibold text-foreground'>{formatPkrFull(data.closingBalance)}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend verticalAlign='top' align='right' height={36} />
            <Bar dataKey='cashIn' name={t('dashboard.metrics.cashIn')} fill='#10b981' radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar dataKey='cashOut' name={t('dashboard.metrics.cashOut')} fill='#ef4444' radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Line
              type='monotone'
              dataKey='closingBalance'
              name={t('dashboard.metrics.closingBalance')}
              stroke='var(--chart-1)'
              strokeWidth={2}
              dot={{ r: 2.5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={t('dashboard.receivablesAgingTitle')}
        tooltip={t('dashboard.receivablesAgingTooltip')}
        isLoading={isAgingLoading}
        error={agingError as Error}
        onRetry={refetchAging}
        isEmpty={agingBuckets.length === 0}
        skeletonType='horizontal-bar'
        tableColumns={agingTableColumns}
        tableRows={agingTableRows}
        csvFilename='receivables-aging'
      >
        <div className='flex flex-col gap-3'>
          <ResponsiveContainer width='100%' height={180}>
            <ComposedChart
              layout='vertical'
              data={agingChartData}
              margin={{ top: 5, right: 20, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray='3 3' horizontal={false} className='stroke-muted/40' />
              <XAxis
                type='number'
                tickFormatter={(val: number) => formatPkrCompact(val)}
                className='text-xs'
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type='category'
                dataKey='label'
                className='text-xs'
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0].payload;
                  return (
                    <div className='rounded-lg border bg-background p-2.5 shadow-md text-xs'>
                      <div className='font-semibold text-foreground'>{data.label}</div>
                      <div className='mt-1 flex items-center justify-between gap-4'>
                        <span className='text-muted-foreground'>{t('dashboard.metrics.amount')}:</span>
                        <span className='font-semibold text-foreground'>{formatPkrFull(data.amount)}</span>
                      </div>
                      <div className='flex items-center justify-between gap-4'>
                        <span className='text-muted-foreground'>{t('dashboard.metrics.customer')}:</span>
                        <span className='font-medium text-foreground'>{formatNumber(data.customerCount)}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey='amount' radius={[0, 4, 4, 0]} maxBarSize={22}>
                {agingChartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.bucketKey === '60+' ? '#f59e0b' : 'var(--chart-1)'}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>

          {topDebtors.length > 0 ? (
            <div className='border-t pt-2.5'>
              <div className='text-xs font-semibold text-muted-foreground mb-1.5'>
                {t('dashboard.topDebtors')}
              </div>
              <div className='flex flex-col gap-1.5'>
                {topDebtors.map((d) => (
                  <div
                    key={d.customerId}
                    className='flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5 text-xs'
                  >
                    <div className='flex flex-col'>
                      <span className='font-medium text-foreground'>{d.name}</span>
                      <span className='text-[10px] text-muted-foreground'>{d.phone}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold tabular-nums text-foreground'>
                        {formatPkrFull(d.amount)}
                      </span>
                      {d.oldestDays > 30 ? (
                        <Badge variant='outline' className='text-[10px] text-amber-600 dark:text-amber-400'>
                          {d.oldestDays}d
                        </Badge>
                      ) : null}
                      {d.phone ? (
                        <Button
                          type='button'
                          size='icon'
                          variant='ghost'
                          className='h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          onClick={() => handleWhatsApp(d.phone, d.name, d.amount)}
                          aria-label={t('dashboard.actions.whatsappReminder')}
                        >
                          <IconBrandWhatsapp className='h-4 w-4' />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </ChartCard>
    </div>
  );
}
