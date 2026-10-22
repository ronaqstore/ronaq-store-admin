'use client';

import type { Column } from '@tanstack/react-table';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { DataTableFilterClear } from '@/components/ui/table/data-table-filter-clear';
import { useT } from '@/i18n/use-t';

type RangeValue = [number, number];

function getIsValidRange(value: unknown): value is RangeValue {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseDraftNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function orderRange(from: number, to: number): RangeValue {
  return from <= to ? [from, to] : [to, from];
}

const numberInputClassName =
  'h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-2.5 shadow-none [appearance:textfield] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

const inputShellClassName = cn(
  'flex h-9 min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-background',
  'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40'
);

interface DataTableSliderFilterProps<TData> {
  column: Column<TData, unknown>;
  title?: string;
}

export function DataTableSliderFilter<TData>({ column, title }: DataTableSliderFilterProps<TData>) {
  const id = React.useId();
  const t = useT();
  const [open, setOpen] = React.useState(false);

  const columnFilterValue = getIsValidRange(column.getFilterValue())
    ? (column.getFilterValue() as RangeValue)
    : undefined;

  const defaultRange = column.columnDef.meta?.range;
  const unit = column.columnDef.meta?.unit;

  const { min, max, step } = React.useMemo(() => {
    let minValue = 0;
    let maxValue = 100;

    if (defaultRange && getIsValidRange(defaultRange)) {
      [minValue, maxValue] = defaultRange;
    } else {
      const values = column.getFacetedMinMaxValues();
      if (values && Array.isArray(values) && values.length === 2) {
        const [facetMinValue, facetMaxValue] = values;
        if (typeof facetMinValue === 'number' && typeof facetMaxValue === 'number') {
          minValue = facetMinValue;
          maxValue = facetMaxValue;
        }
      }
    }

    const rangeSize = maxValue - minValue;
    const nextStep =
      rangeSize <= 20
        ? 1
        : rangeSize <= 100
          ? Math.ceil(rangeSize / 20)
          : Math.max(1, Math.ceil(rangeSize / 100));

    return { min: minValue, max: maxValue, step: nextStep };
  }, [column, defaultRange]);

  const appliedRange = React.useMemo((): RangeValue => {
    return columnFilterValue ?? [min, max];
  }, [columnFilterValue, min, max]);

  const [fromDraft, setFromDraft] = React.useState(String(appliedRange[0]));
  const [toDraft, setToDraft] = React.useState(String(appliedRange[1]));
  const [sliderDraft, setSliderDraft] = React.useState<RangeValue>(appliedRange);

  React.useEffect(() => {
    setFromDraft(String(appliedRange[0]));
    setToDraft(String(appliedRange[1]));
    setSliderDraft(appliedRange);
  }, [appliedRange]);

  const formatValue = React.useCallback((value: number) => {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }, []);

  const applyFilter = React.useCallback(() => {
    const parsedFrom = parseDraftNumber(fromDraft);
    const parsedTo = parseDraftNumber(toDraft);
    if (parsedFrom == null || parsedTo == null) {
      setFromDraft(String(appliedRange[0]));
      setToDraft(String(appliedRange[1]));
      setSliderDraft(appliedRange);
      return;
    }

    const ordered = orderRange(clamp(parsedFrom, min, max), clamp(parsedTo, min, max));
    setFromDraft(String(ordered[0]));
    setToDraft(String(ordered[1]));
    setSliderDraft(ordered);
    column.setFilterValue(ordered);
  }, [appliedRange, column, fromDraft, max, min, toDraft]);

  const onFromInputChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (next === '' || /^\d*$/.test(next)) {
      setFromDraft(next);
      const parsed = parseDraftNumber(next);
      if (parsed != null) {
        setSliderDraft((prev) => orderRange(clamp(parsed, min, max), prev[1]));
      }
    }
  }, [max, min]);

  const onToInputChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (next === '' || /^\d*$/.test(next)) {
      setToDraft(next);
      const parsed = parseDraftNumber(next);
      if (parsed != null) {
        setSliderDraft((prev) => orderRange(prev[0], clamp(parsed, min, max)));
      }
    }
  }, [max, min]);

  const onSliderValueChange = React.useCallback(
    (value: number | readonly number[]) => {
      if (Array.isArray(value) && value.length === 2) {
        const next = orderRange(Number(value[0]), Number(value[1]));
        setSliderDraft(next);
        setFromDraft(String(next[0]));
        setToDraft(String(next[1]));
      }
    },
    []
  );

  const onReset = React.useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      event.stopPropagation();
      setFromDraft(String(min));
      setToDraft(String(max));
      setSliderDraft([min, max]);
      column.setFilterValue(undefined);
    },
    [column, max, min]
  );

  const onDraftKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyFilter();
      }
    },
    [applyFilter]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant='outline' size='sm' className='border-dashed' />}>
        {columnFilterValue ? (
          <DataTableFilterClear title={title} onReset={onReset} />
        ) : (
          <Icons.adjustments className='size-4' />
        )}
        <span>{title}</span>
        {columnFilterValue ? (
          <>
            <Separator orientation='vertical' className='mx-0.5 data-[orientation=vertical]:h-4' />
            {formatValue(columnFilterValue[0])} - {formatValue(columnFilterValue[1])}
            {unit ? ` ${unit}` : ''}
          </>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align='start' className='flex w-80 flex-col gap-4'>
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between gap-2'>
            <p className='leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              {title}
            </p>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-7 shrink-0 text-muted-foreground hover:text-foreground'
              aria-label={t('common.close')}
              onClick={() => setOpen(false)}
            >
              <Icons.close className='size-4' />
            </Button>
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <div className='min-w-0'>
              <Label htmlFor={`${id}-from`} className='sr-only'>
                {t('table.from')}
              </Label>
              <div className={inputShellClassName}>
                <Input
                  id={`${id}-from`}
                  type='text'
                  inputMode='numeric'
                  autoComplete='off'
                  placeholder={min.toString()}
                  value={fromDraft}
                  onChange={onFromInputChange}
                  onKeyDown={onDraftKeyDown}
                  className={numberInputClassName}
                />
                {unit ? (
                  <span className='text-muted-foreground flex shrink-0 items-center border-s bg-muted/60 px-2 text-xs font-medium'>
                    {unit}
                  </span>
                ) : null}
              </div>
            </div>
            <div className='min-w-0'>
              <Label htmlFor={`${id}-to`} className='sr-only'>
                {t('table.to')}
              </Label>
              <div className={inputShellClassName}>
                <Input
                  id={`${id}-to`}
                  type='text'
                  inputMode='numeric'
                  autoComplete='off'
                  placeholder={max.toString()}
                  value={toDraft}
                  onChange={onToInputChange}
                  onKeyDown={onDraftKeyDown}
                  className={numberInputClassName}
                />
                {unit ? (
                  <span className='text-muted-foreground flex shrink-0 items-center border-s bg-muted/60 px-2 text-xs font-medium'>
                    {unit}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <Label htmlFor={`${id}-slider`} className='sr-only'>
            {title} slider
          </Label>
          <Slider
            id={`${id}-slider`}
            min={min}
            max={max}
            step={step}
            value={sliderDraft}
            onValueChange={onSliderValueChange}
          />
        </div>
        <div className='grid grid-cols-2 gap-2'>
          <Button
            type='button'
            aria-label={t('table.clearColumnFilter', { title: title ?? column.id })}
            variant='outline'
            size='sm'
            onClick={onReset}
          >
            {t('table.clear')}
          </Button>
          <Button type='button' size='sm' onClick={applyFilter}>
            {t('table.apply')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
