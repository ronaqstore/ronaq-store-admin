'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { IconCalendar, IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useT } from '@/i18n/use-t';
import { cn } from '@/lib/utils';
import type {
  DashboardCustomDateRange,
  DashboardPeriod,
  DateRangeFilterProps,
  DateRangePeriodOption,
} from '@/types/charts';

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYmd(value: string | null | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function defaultCustomRange(): DashboardCustomDateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 6);
  return { from: toYmd(from), to: toYmd(to) };
}

export function DateRangeFilter({
  currentPeriod,
  compare,
  onPeriodChange,
  onCompareChange,
  className,
}: DateRangeFilterProps) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activePeriod =
    (currentPeriod as DashboardPeriod) ??
    ((searchParams.get('period') as DashboardPeriod) || '7d');

  const compareParam = searchParams.get('compare');
  const isCompareChecked =
    compare !== undefined
      ? compare
      : compareParam !== null
        ? compareParam === 'true'
        : activePeriod !== 'today' && activePeriod !== 'yesterday';

  const urlFrom = searchParams.get('from') ?? '';
  const urlTo = searchParams.get('to') ?? '';

  const [draftFrom, setDraftFrom] = useState(urlFrom);
  const [draftTo, setDraftTo] = useState(urlTo);
  const [pickerOpen, setPickerOpen] = useState(false);

  const periods: DateRangePeriodOption[] = [
    { key: 'today', labelKey: 'dashboard.quickPills.today' },
    { key: 'yesterday', labelKey: 'dashboard.quickPills.yesterday' },
    { key: '7d', labelKey: 'dashboard.quickPills.last7d' },
    { key: '30d', labelKey: 'dashboard.quickPills.last30d' },
    { key: 'this_month', labelKey: 'dashboard.quickPills.thisMonth' },
    { key: 'last_month', labelKey: 'dashboard.quickPills.lastMonth' },
    { key: 'custom', labelKey: 'dashboard.quickPills.custom' },
  ];

  const pushParams = useCallback(
    (next: URLSearchParams) => {
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname],
  );

  const commitCustom = useCallback(
    (fromRaw: string, toRaw: string, compareValue: boolean) => {
      if (!fromRaw || !toRaw) return;
      const from = fromRaw <= toRaw ? fromRaw : toRaw;
      const to = fromRaw <= toRaw ? toRaw : fromRaw;
      setDraftFrom(from);
      setDraftTo(to);
      const params = new URLSearchParams(searchParams.toString());
      params.set('period', 'custom');
      params.set('from', from);
      params.set('to', to);
      params.set('compare', String(compareValue));
      onPeriodChange?.('custom');
      pushParams(params);
    },
    [searchParams, onPeriodChange, pushParams],
  );

  const updatePreset = useCallback(
    (newPeriod: DashboardPeriod, newCompare: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('period', newPeriod);
      params.set('compare', String(newCompare));
      if (newPeriod !== 'custom') {
        params.delete('from');
        params.delete('to');
      }
      pushParams(params);
    },
    [searchParams, pushParams],
  );

  const handleSelectPeriod = (periodKey: DashboardPeriod) => {
    onPeriodChange?.(periodKey);
    if (periodKey === 'custom') {
      const fallback = defaultCustomRange();
      const from = urlFrom || draftFrom || fallback.from;
      const to = urlTo || draftTo || fallback.to;
      commitCustom(from, to, isCompareChecked);
      setPickerOpen(true);
      return;
    }
    setPickerOpen(false);
    updatePreset(periodKey, isCompareChecked);
  };

  const handleToggleCompare = (checked: boolean) => {
    onCompareChange?.(checked);
    if (activePeriod === 'custom') {
      const from = draftFrom || urlFrom;
      const to = draftTo || urlTo;
      if (from && to) {
        commitCustom(from, to, checked);
        return;
      }
    }
    updatePreset(activePeriod, checked);
  };

  const selectedRange: DateRange | undefined = useMemo(() => {
    const from = parseYmd(draftFrom || urlFrom);
    const to = parseYmd(draftTo || urlTo);
    if (!from && !to) return undefined;
    return { from, to };
  }, [draftFrom, draftTo, urlFrom, urlTo]);

  const rangeLabel = useMemo(() => {
    const from = parseYmd(draftFrom || urlFrom);
    const to = parseYmd(draftTo || urlTo);
    if (from && to) {
      return `${format(from, 'dd MMM yyyy')} – ${format(to, 'dd MMM yyyy')}`;
    }
    if (from) return format(from, 'dd MMM yyyy');
    return t('common.pickDateRange');
  }, [draftFrom, draftTo, urlFrom, urlTo, t]);

  const handleRangeSelect = (range: DateRange | undefined) => {
    const from = range?.from ? toYmd(range.from) : '';
    const to = range?.to ? toYmd(range.to) : '';
    setDraftFrom(from);
    setDraftTo(to);
    if (from && to) {
      commitCustom(from, to, isCompareChecked);
      setPickerOpen(false);
    }
  };

  const canApply = Boolean(draftFrom && draftTo);

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div className='bg-muted/60 flex flex-wrap items-center gap-1 rounded-lg p-1'>
          {periods.map((p) => {
            const isSelected = activePeriod === p.key;
            return (
              <Button
                key={p.key}
                type='button'
                size='sm'
                variant={isSelected ? 'default' : 'ghost'}
                className='h-8 text-xs font-medium'
                aria-pressed={isSelected}
                aria-label={t(p.labelKey)}
                onClick={() => handleSelectPeriod(p.key)}
              >
                {isSelected ? (
                  <IconCheck className='me-1 h-3.5 w-3.5' />
                ) : (
                  <IconCalendar className='text-muted-foreground me-1 h-3.5 w-3.5' />
                )}
                {t(p.labelKey)}
              </Button>
            );
          })}
        </div>

        <div className='flex shrink-0 items-center gap-2 px-1'>
          <Checkbox
            id='dashboard-compare-toggle'
            checked={isCompareChecked}
            onCheckedChange={(c) => handleToggleCompare(Boolean(c))}
          />
          <label
            htmlFor='dashboard-compare-toggle'
            className='text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium select-none'
          >
            {t('dashboard.compareWithPrevious')}
          </label>
        </div>
      </div>

      {activePeriod === 'custom' ? (
        <div className='flex flex-wrap items-center gap-2'>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger
              render={
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-9 min-w-60 justify-start text-xs font-normal'
                  aria-label={t('common.pickDateRange')}
                />
              }
            >
              <IconCalendar className='text-muted-foreground me-2 h-4 w-4' />
              <span className='truncate'>{rangeLabel}</span>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                autoFocus
                mode='range'
                numberOfMonths={2}
                selected={selectedRange}
                onSelect={handleRangeSelect}
                defaultMonth={selectedRange?.from}
              />
            </PopoverContent>
          </Popover>

          <Button
            type='button'
            size='sm'
            className='h-9 text-xs'
            disabled={!canApply}
            onClick={() => commitCustom(draftFrom, draftTo, isCompareChecked)}
          >
            {t('common.apply')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
