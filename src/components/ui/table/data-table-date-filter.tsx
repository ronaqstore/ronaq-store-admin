'use client';

import type { Column } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { DataTableFilterClear } from '@/components/ui/table/data-table-filter-clear';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/format';

function parseAsDate(timestamp: number | string | undefined): Date | undefined {
  if (timestamp === null || timestamp === undefined || timestamp === '') return undefined;
  const numericTimestamp = typeof timestamp === 'string' ? Number(timestamp) : timestamp;
  if (!Number.isFinite(numericTimestamp)) return undefined;
  const date = new Date(numericTimestamp);
  return !Number.isNaN(date.getTime()) ? date : undefined;
}

function parseColumnFilterValue(value: unknown): Array<string | number | undefined> {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'number' || typeof item === 'string') return item;
      return undefined;
    });
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return [value];
  }

  return [];
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

interface DataTableDateFilterProps<TData> {
  column: Column<TData, unknown>;
  title?: string;
  multiple?: boolean;
}

export function DataTableDateFilter<TData>({
  column,
  title,
  multiple
}: DataTableDateFilterProps<TData>) {
  const t = useTranslations();
  const columnFilterValue = column.getFilterValue();

  const range = React.useMemo<DateRange>(() => {
    if (!multiple) return { from: undefined, to: undefined };
    const timestamps = parseColumnFilterValue(columnFilterValue);
    return {
      from: parseAsDate(timestamps[0]),
      to: parseAsDate(timestamps[1])
    };
  }, [columnFilterValue, multiple]);

  const singleDate = React.useMemo(() => {
    if (multiple) return undefined;
    const timestamps = parseColumnFilterValue(columnFilterValue);
    return parseAsDate(timestamps[0]);
  }, [columnFilterValue, multiple]);

  const applyRange = React.useCallback(
    (from?: Date, to?: Date) => {
      if (!from && !to) {
        column.setFilterValue(undefined);
        return;
      }

      let fromTs = from ? startOfDay(from).getTime() : undefined;
      let toTs = to ? startOfDay(to).getTime() : undefined;

      // Keep range ordered when both ends are set.
      if (fromTs != null && toTs != null && toTs < fromTs) {
        const swap = fromTs;
        fromTs = toTs;
        toTs = swap;
      }

      if (fromTs != null && toTs != null) {
        column.setFilterValue([fromTs, toTs]);
        return;
      }

      // From-only (open-ended) or To-only (up to date).
      if (fromTs != null) {
        column.setFilterValue([fromTs]);
        return;
      }

      column.setFilterValue(['', toTs]);
    },
    [column]
  );

  const onSelectFrom = React.useCallback(
    (date: Date | undefined) => {
      applyRange(date, range.to);
    },
    [applyRange, range.to]
  );

  const onSelectTo = React.useCallback(
    (date: Date | undefined) => {
      applyRange(range.from, date);
    },
    [applyRange, range.from]
  );

  const onSelectSingle = React.useCallback(
    (date: Date | undefined) => {
      column.setFilterValue(date ? startOfDay(date).getTime() : undefined);
    },
    [column]
  );

  const onReset = React.useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      event.stopPropagation();
      column.setFilterValue(undefined);
    },
    [column]
  );

  const hasValue = multiple ? !!(range.from || range.to) : !!singleDate;

  const formatRangeLabel = React.useCallback(
    (value: DateRange) => {
      if (value.from && value.to) {
        return `${formatDate(value.from)} – ${formatDate(value.to)}`;
      }
      if (value.from) {
        return `${t('table.from')} ${formatDate(value.from)}`;
      }
      if (value.to) {
        return `${t('table.to')} ${formatDate(value.to)}`;
      }
      return '';
    },
    [t]
  );

  const label = React.useMemo(() => {
    if (multiple) {
      const hasSelectedDates = !!(range.from || range.to);
      const dateText = hasSelectedDates
        ? formatRangeLabel(range)
        : t('common.pickDateRange');

      return (
        <span className='flex items-center gap-2'>
          <span>{title}</span>
          {hasSelectedDates ? (
            <>
              <Separator
                orientation='vertical'
                className='mx-0.5 data-[orientation=vertical]:h-4'
              />
              <span>{dateText}</span>
            </>
          ) : null}
        </span>
      );
    }

    const hasSelectedDate = !!singleDate;
    const dateText = hasSelectedDate ? formatDate(singleDate) : t('common.pickDate');

    return (
      <span className='flex items-center gap-2'>
        <span>{title}</span>
        {hasSelectedDate ? (
          <>
            <Separator orientation='vertical' className='mx-0.5 data-[orientation=vertical]:h-4' />
            <span>{dateText}</span>
          </>
        ) : null}
      </span>
    );
  }, [formatRangeLabel, multiple, range, singleDate, t, title]);

  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' size='sm' className='border-dashed' />}>
        {hasValue ? <DataTableFilterClear title={title} onReset={onReset} /> : <Icons.calendar />}
        {label}
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        {multiple ? (
          <div className='flex flex-col gap-3 p-3 sm:flex-row sm:gap-4'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-2 px-1'>
                <p className='text-sm font-medium text-foreground'>{t('table.from')}</p>
                {range.from ? (
                  <button
                    type='button'
                    className='text-xs text-muted-foreground hover:text-foreground'
                    onClick={() => applyRange(undefined, range.to)}
                  >
                    {t('table.clear')}
                  </button>
                ) : null}
              </div>
              <Calendar
                autoFocus
                mode='single'
                selected={range.from}
                onSelect={onSelectFrom}
                disabled={range.to ? { after: range.to } : undefined}
              />
              <p className='px-1 text-[11px] text-muted-foreground'>{t('common.fromOptionalHint')}</p>
            </div>
            <Separator className='sm:hidden' />
            <div className='hidden w-px self-stretch bg-border sm:block' aria-hidden />
            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-2 px-1'>
                <p className='text-sm font-medium text-foreground'>{t('table.to')}</p>
                {range.to ? (
                  <button
                    type='button'
                    className='text-xs text-muted-foreground hover:text-foreground'
                    onClick={() => applyRange(range.from, undefined)}
                  >
                    {t('table.clear')}
                  </button>
                ) : null}
              </div>
              <Calendar
                mode='single'
                selected={range.to}
                onSelect={onSelectTo}
                disabled={range.from ? { before: range.from } : undefined}
                defaultMonth={range.to ?? range.from}
              />
              <p className='px-1 text-[11px] text-muted-foreground'>{t('common.toOptionalHint')}</p>
            </div>
          </div>
        ) : (
          <Calendar autoFocus mode='single' selected={singleDate} onSelect={onSelectSingle} />
        )}
      </PopoverContent>
    </Popover>
  );
}
