'use client';

import { useState, useCallback } from 'react';
import {
  IconChartBar,
  IconDownload,
  IconHelpCircle,
  IconRefresh,
  IconTable,
} from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartSkeleton } from './chart-skeleton';
import { EmptyChart } from './empty-chart';
import { useT } from '@/i18n/use-t';
import type { ChartCardProps } from '@/types/charts';

export function ChartCard({
  title,
  description,
  tooltip,
  periodLabel,
  isLoading = false,
  error = null,
  onRetry,
  isEmpty = false,
  emptyTitle,
  emptyDescription,
  emptyActionHref,
  emptyActionLabel,
  skeletonType = 'bar',
  height = 320,
  metrics,
  selectedMetric,
  onSelectMetric,
  tableColumns,
  tableRows,
  csvFilename = 'chart-export',
  children,
}: ChartCardProps) {
  const t = useT();
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const handleExportCsv = useCallback(() => {
    if (!tableColumns || !tableRows || tableRows.length === 0) return;
    const headerRow = tableColumns.map((c) => `"${c.label}"`).join(',');
    const dataRows = tableRows.map((row) =>
      tableColumns
        .map((c) => {
          const val = row[c.key] ?? '';
          return `"${String(val).replaceAll('"', '""')}"`;
        })
        .join(','),
    );
    const csvContent = [headerRow, ...dataRows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${csvFilename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [tableColumns, tableRows, csvFilename]);

  return (
    <Card className='flex flex-col'>
      <CardHeader className='flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <CardTitle className='text-base font-semibold'>{title}</CardTitle>
            {tooltip ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    type='button'
                    className='text-muted-foreground hover:text-foreground inline-flex items-center'
                    aria-label={title}
                  >
                    <IconHelpCircle className='h-4 w-4' />
                  </TooltipTrigger>
                  <TooltipContent side='top' className='max-w-xs text-xs'>
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
            {periodLabel ? (
              <Badge variant='outline' className='text-xs font-normal'>
                {periodLabel}
              </Badge>
            ) : null}
          </div>
          {description ? (
            <CardDescription className='text-xs'>{description}</CardDescription>
          ) : null}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          {metrics && metrics.length > 1 ? (
            <div className='bg-muted/60 inline-flex rounded-lg p-0.5'>
              {metrics.map((m) => (
                <Button
                  key={m.key}
                  type='button'
                  size='sm'
                  variant={selectedMetric === m.key ? 'default' : 'ghost'}
                  className='h-7 text-xs font-medium'
                  aria-pressed={selectedMetric === m.key}
                  aria-label={m.label}
                  onClick={() => onSelectMetric?.(m.key)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          ) : null}

          {tableColumns && tableRows ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  type='button'
                  className='hover:bg-muted inline-flex h-8 w-8 items-center justify-center rounded-md border'
                  onClick={() =>
                    setViewMode((v) => (v === 'chart' ? 'table' : 'chart'))
                  }
                  aria-label={
                    viewMode === 'chart'
                      ? t('dashboard.tableToggle')
                      : t('dashboard.chartToggle')
                  }
                >
                  {viewMode === 'chart' ? (
                    <IconTable className='h-4 w-4' />
                  ) : (
                    <IconChartBar className='h-4 w-4' />
                  )}
                </TooltipTrigger>
                <TooltipContent side='bottom' className='text-xs'>
                  {viewMode === 'chart'
                    ? t('dashboard.tableToggle')
                    : t('dashboard.chartToggle')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}

          {tableColumns && tableRows ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  type='button'
                  className='hover:bg-muted inline-flex h-8 w-8 items-center justify-center rounded-md border'
                  onClick={handleExportCsv}
                  aria-label={t('dashboard.exportCsv')}
                >
                  <IconDownload className='h-4 w-4' />
                </TooltipTrigger>
                <TooltipContent side='bottom' className='text-xs'>
                  {t('dashboard.exportCsv')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className='flex-1 pt-2'>
        {isLoading ? (
          <ChartSkeleton type={skeletonType} height={height} />
        ) : error ? (
          <div
            className='flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50/50 p-6 text-center dark:border-red-950 dark:bg-red-950/20'
            style={{ height }}
          >
            <p className='text-xs font-medium text-red-600 dark:text-red-400'>
              {error.message || t('dashboard.errorLoading')}
            </p>
            {onRetry ? (
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='mt-3'
                onClick={onRetry}
              >
                <IconRefresh className='me-1.5 h-3.5 w-3.5' />
                {t('dashboard.retry')}
              </Button>
            ) : null}
          </div>
        ) : isEmpty ? (
          <EmptyChart
            title={emptyTitle}
            description={emptyDescription}
            actionHref={emptyActionHref}
            actionLabel={emptyActionLabel}
          />
        ) : viewMode === 'table' && tableColumns && tableRows ? (
          <div className='max-h-96 overflow-auto rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  {tableColumns.map((col) => (
                    <TableHead
                      key={col.key}
                      className={
                        col.align === 'right'
                          ? 'text-end'
                          : col.align === 'center'
                            ? 'text-center'
                            : 'text-start'
                      }
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row, idx) => (
                  <TableRow key={idx}>
                    {tableColumns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={
                          col.align === 'right'
                            ? 'text-end tabular-nums'
                            : col.align === 'center'
                              ? 'text-center'
                              : 'text-start'
                        }
                      >
                        {row[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div dir='ltr' className='w-full' style={{ height }}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
