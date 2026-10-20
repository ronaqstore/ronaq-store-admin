'use client';

import type { Option } from '@/types/data-table';
import type { Column } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { DataTableFilterClear } from '@/components/ui/table/data-table-filter-clear';
import { useT } from '@/i18n/use-t';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import * as React from 'react';

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: Option[];
  multiple?: boolean;
  /** `sheet` = full-width bottom picker (filters sheet). Default popover for desktop toolbar. */
  presentation?: 'popover' | 'sheet';
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  multiple,
  presentation = 'popover'
}: DataTableFacetedFilterProps<TData, TValue>) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const isSheet = presentation === 'sheet';

  const columnFilterValue = column?.getFilterValue();
  const selectedValues = React.useMemo(
    () => new Set(Array.isArray(columnFilterValue) ? columnFilterValue : []),
    [columnFilterValue]
  );

  const onItemSelect = React.useCallback(
    (option: Option, isSelected: boolean) => {
      if (!column) return;

      if (multiple) {
        const newSelectedValues = new Set(selectedValues);
        if (isSelected) {
          newSelectedValues.delete(option.value);
        } else {
          newSelectedValues.add(option.value);
        }
        const filterValues = Array.from(newSelectedValues);
        column.setFilterValue(filterValues.length ? filterValues : undefined);
      } else {
        column.setFilterValue(isSelected ? undefined : [option.value]);
        setOpen(false);
      }
    },
    [column, multiple, selectedValues]
  );

  const onReset = React.useCallback(
    (event?: React.MouseEvent | React.KeyboardEvent) => {
      event?.stopPropagation();
      column?.setFilterValue(undefined);
    },
    [column]
  );

  const FilterIcon = column?.columnDef.meta?.icon ?? Icons.adjustments;

  const selectedLabels = options.filter((option) => selectedValues.has(option.value));

  const triggerLabel =
    selectedLabels.length === 0
      ? title
      : selectedLabels.length === 1
        ? selectedLabels[0]?.label
        : `${selectedLabels.length} ${t('common.selected')}`;

  const list = (
    <Command shouldFilter={false}>
      <CommandList className={cn(isSheet ? 'max-h-[min(50dvh,22rem)]' : 'max-h-full')}>
        <CommandGroup
          className={cn(
            'overflow-x-hidden overflow-y-auto p-0.5 [&_[cmdk-group-items]]:space-y-1',
            !isSheet && 'max-h-[18.75rem]'
          )}
        >
          {options.map((option) => {
            const isSelected = selectedValues.has(option.value);

            return (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => onItemSelect(option, isSelected)}
                className='my-0.5 flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm transition-colors'
              >
                <div
                  className={cn(
                    'border-primary flex size-4 items-center justify-center rounded-sm border',
                    isSelected ? 'bg-primary' : 'opacity-50 [&_svg]:invisible'
                  )}
                >
                  <Icons.check />
                </div>
                {option.icon && <option.icon />}
                <span className='truncate'>{option.label}</span>
                {option.count && (
                  <span className='ms-auto font-mono text-xs'>{option.count}</span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
        {selectedValues.size > 0 && (
          <>
            <CommandSeparator className='my-1' />
            <CommandGroup className='p-0.5'>
              <CommandItem
                onSelect={() => onReset()}
                className='justify-center rounded-md py-1.5 text-center'
              >
                {t('table.resetFilters')}
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );

  if (isSheet) {
    return (
      <>
        <Button
          type='button'
          variant='outline'
          className='h-11 w-full justify-start gap-2 px-3 font-normal'
          onClick={() => setOpen(true)}
        >
          {selectedValues.size > 0 ? (
            <DataTableFilterClear title={title} onReset={onReset} />
          ) : (
            <FilterIcon className='size-4 shrink-0 text-muted-foreground' />
          )}
          <span className='truncate'>{triggerLabel}</span>
          {selectedValues.size > 1 ? (
            <Badge variant='secondary' className='ms-auto rounded-sm px-1.5 font-normal'>
              {selectedValues.size}
            </Badge>
          ) : null}
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side='bottom'
            overlayClassName='z-[60]'
            className='z-[60] max-h-[85dvh] gap-0 rounded-t-[var(--radius)] pb-[max(1rem,env(safe-area-inset-bottom))]'
          >
            <div className='bg-muted mx-auto mt-1 mb-2 h-1 w-10 shrink-0 rounded-full' aria-hidden />
            <SheetHeader className='border-b border-border'>
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <div className='min-h-0 flex-1 overflow-hidden px-2 py-2'>{list}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant='outline' size='sm' className='h-8 gap-1.5 border-dashed' />}
      >
        {selectedValues?.size > 0 ? (
          <DataTableFilterClear title={title} onReset={onReset} />
        ) : (
          <FilterIcon className='size-4' />
        )}
        {title}
        {selectedValues?.size > 0 && (
          <>
            <Separator orientation='vertical' className='mx-0.5 data-[orientation=vertical]:h-4' />
            <Badge variant='secondary' className='rounded-sm px-1 font-normal lg:hidden'>
              {selectedValues.size}
            </Badge>
            <div className='hidden items-center gap-1 lg:flex'>
              {selectedValues.size > 2 ? (
                <Badge variant='secondary' className='rounded-sm px-1 font-normal'>
                  {selectedValues.size} {t('common.selected')}
                </Badge>
              ) : (
                selectedLabels.map((option) => (
                  <Badge
                    variant='secondary'
                    key={option.value}
                    className='rounded-sm px-1 font-normal'
                  >
                    {option.label}
                  </Badge>
                ))
              )}
            </div>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className='w-48 p-1.5' align='start' sideOffset={6}>
        {list}
      </PopoverContent>
    </Popover>
  );
}
