'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DataTableAsyncFacetedFilter } from '@/components/ui/table/data-table-async-faceted-filter';
import { DataTableDateFilter } from '@/components/ui/table/data-table-date-filter';
import { DataTableFacetedFilter } from '@/components/ui/table/data-table-faceted-filter';
import { DataTableSliderFilter } from '@/components/ui/table/data-table-slider-filter';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { translateMaybe } from '@/i18n/translate-maybe';
import type { DataTableFiltersSheetProps, FilterBlockProps } from './types';

export function DataTableFiltersSheet<TData>({
  table,
  open,
  onOpenChange,
  pageSizeOptions = [20, 30, 50, 100]
}: DataTableFiltersSheetProps<TData>) {
  const t = useTranslations();
  const filterColumns = React.useMemo(() => {
    const filterable = table
      .getAllColumns()
      .filter((column) => column.getCanFilter() && column.columnDef.meta?.variant);

    const primaryText =
      filterable.find(
        (column) =>
          column.columnDef.meta?.variant === 'text' && column.columnDef.meta?.primary === true
      ) ?? filterable.find((column) => column.columnDef.meta?.variant === 'text');

    return filterable.filter((column) => {
      if (column.columnDef.meta?.variant !== 'text') return true;
      return column.id !== primaryText?.id;
    });
  }, [table]);

  const sortable = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanSort() && column.id !== 'actions'),
    [table]
  );

  const sorting = table.getState().sorting[0];
  const sortValue = sorting ? `${sorting.id}:${sorting.desc ? 'desc' : 'asc'}` : '';

  const onClear = () => {
    table.resetColumnFilters();
    table.resetSorting();
  };

  const handleSortChange = (value: string | null) => {
    if (!value || value === '__none__') {
      table.setSorting([]);
      return;
    }
    const [id, dir] = value.split(':');
    if (!id) return;
    table.setSorting([{ id, desc: dir === 'desc' }]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='bottom'
        className={cn(
          'max-h-[85dvh] gap-0 rounded-t-[var(--radius)] pb-[max(1rem,env(safe-area-inset-bottom))]'
        )}
      >
        <div className='bg-muted mx-auto mt-1 mb-2 h-1 w-10 shrink-0 rounded-full' aria-hidden />
        <SheetHeader>
          <SheetTitle>{t('table.filters')}</SheetTitle>
        </SheetHeader>

        <div className='no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-2'>
          {sortable.length > 0 ? (
            <div className='grid gap-2'>
              <Label htmlFor='table-sort'>{t('table.sortBy')}</Label>
              <Select
                items={[
                  { value: '__none__', label: '—' },
                  ...sortable.flatMap((column) => {
                    const label = translateMaybe(
                      column.columnDef.meta?.label ?? column.id,
                      t
                    );
                    return [
                      { value: `${column.id}:asc`, label: `${label} ↑` },
                      { value: `${column.id}:desc`, label: `${label} ↓` }
                    ];
                  })
                ]}
                value={sortValue || '__none__'}
                onValueChange={handleSortChange}
              >
                <SelectTrigger id='table-sort' className='h-11 w-full'>
                  <SelectValue placeholder={t('table.sortBy')} />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  side='bottom'
                  sideOffset={8}
                  className='z-[60] w-[min(100vw-2rem,var(--anchor-width))] max-h-[min(50dvh,24rem)]'
                >
                  <SelectGroup>
                    <SelectItem value='__none__'>—</SelectItem>
                    {sortable.map((column) => {
                      const label = translateMaybe(
                        column.columnDef.meta?.label ?? column.id,
                        t
                      );
                      return (
                        <React.Fragment key={column.id}>
                          <SelectItem value={`${column.id}:asc`}>{label} ↑</SelectItem>
                          <SelectItem value={`${column.id}:desc`}>{label} ↓</SelectItem>
                        </React.Fragment>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {filterColumns.map((column) => (
            <FilterBlock key={column.id} column={column} />
          ))}

          <div className='grid gap-2'>
            <Label htmlFor='table-page-size'>{t('table.rowsPerPage')}</Label>
            <Select
              items={pageSizeOptions.map((size) => ({
                value: `${size}`,
                label: `${size}`
              }))}
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                if (value != null) table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger id='table-page-size' className='h-11 w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                side='bottom'
                sideOffset={8}
                className='z-[60] w-[min(100vw-2rem,var(--anchor-width))]'
              >
                <SelectGroup>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className='flex-row gap-2 px-4'>
          <Button type='button' variant='outline' className='h-11 flex-1' onClick={onClear}>
            {t('table.clear')}
          </Button>
          <Button type='button' className='h-11 flex-1' onClick={() => onOpenChange(false)}>
            {t('table.apply')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function FilterBlock<TData>({ column }: FilterBlockProps<TData>) {
  const t = useTranslations();
  const meta = column.columnDef.meta;
  if (!meta?.variant) return null;

  const translate = (key: string) => {
    try {
      return (t as (k: string) => string)(key);
    } catch {
      return key;
    }
  };
  const label = meta.label ? translateMaybe(meta.label, t) : column.id;

  if (meta.variant === 'text') {
    const raw = column.getFilterValue();
    const textValue = Array.isArray(raw)
      ? raw.map(String).join(' ')
      : raw == null
        ? ''
        : String(raw);
    return (
      <div className='grid gap-2'>
        <Label htmlFor={`filter-${column.id}`}>{label}</Label>
        <Input
          id={`filter-${column.id}`}
          className='h-11 w-full'
          placeholder={
            (meta.placeholderKey ? translate(meta.placeholderKey) : meta.placeholder) ?? label
          }
          value={textValue}
          onChange={(event) => column.setFilterValue(event.target.value)}
        />
      </div>
    );
  }

  if (meta.variant === 'number') {
    return (
      <div className='grid gap-2'>
        <Label htmlFor={`filter-${column.id}`}>{label}</Label>
        <div className='relative'>
          <Input
            id={`filter-${column.id}`}
            type='number'
            inputMode='numeric'
            className={cn('h-11 w-full', meta.unit && 'pe-10')}
            placeholder={
              (meta.placeholderKey ? translate(meta.placeholderKey) : meta.placeholder) ?? label
            }
            value={(column.getFilterValue() as string) ?? ''}
            onChange={(event) => column.setFilterValue(event.target.value)}
          />
          {meta.unit ? (
            <span className='bg-accent text-muted-foreground absolute inset-e-0 top-0 bottom-0 flex items-center rounded-e-md px-3 text-sm'>
              {meta.unit}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  if (meta.variant === 'range') {
    return (
      <div className='grid gap-2'>
        <Label>{label}</Label>
        <DataTableSliderFilter column={column} title={label} />
      </div>
    );
  }

  if (meta.variant === 'date' || meta.variant === 'dateRange') {
    return (
      <div className='grid gap-2'>
        <Label>{label}</Label>
        <DataTableDateFilter
          column={column}
          title={label}
          multiple={meta.variant === 'dateRange'}
        />
      </div>
    );
  }

  if (meta.variant === 'select' || meta.variant === 'multiSelect') {
    const options =
      typeof meta.options === 'function' ? meta.options(translate) : (meta.options ?? []);
    return (
      <div className='grid gap-2'>
        <Label>{label}</Label>
        {meta.asyncOptions ? (
          <DataTableAsyncFacetedFilter
            column={column}
            title={label}
            config={meta.asyncOptions}
            multiple={meta.variant === 'multiSelect'}
            presentation='sheet'
          />
        ) : (
          <DataTableFacetedFilter
            column={column}
            title={label}
            options={options}
            multiple={meta.variant === 'multiSelect'}
            presentation='sheet'
          />
        )}
      </div>
    );
  }

  return null;
}
