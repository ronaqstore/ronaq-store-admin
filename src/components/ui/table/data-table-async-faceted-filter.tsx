'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import type { Column } from '@tanstack/react-table';
import * as React from 'react';

import { ComboboxListSkeleton } from '@/components/common/combobox-list-skeleton';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
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
import { Skeleton } from '@/components/ui/skeleton';
import { DataTableFilterClear } from '@/components/ui/table/data-table-filter-clear';
import { useT, translateMaybe } from '@/i18n/use-t';
import { cn } from '@/lib/utils';
import type { AsyncFacetedFilterConfig } from '@/types/data-table';

const PAGE_SIZE = 20;

interface DataTableAsyncFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  config: AsyncFacetedFilterConfig;
  multiple?: boolean;
  /** `sheet` = full-width bottom picker (filters sheet). Default popover for desktop toolbar. */
  presentation?: 'popover' | 'sheet';
}

export function DataTableAsyncFacetedFilter<TData, TValue>({
  column,
  title,
  config,
  multiple,
  presentation = 'popover'
}: DataTableAsyncFacetedFilterProps<TData, TValue>) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [labelCache, setLabelCache] = React.useState<Record<string, string>>({});
  const isSheet = presentation === 'sheet';

  const activeOnly = config.activeOnly ?? true;
  const searchPlaceholder =
    config.searchPlaceholder ??
    (config.searchPlaceholderKey
      ? translateMaybe(config.searchPlaceholderKey, t)
      : t('nav.searchPlaceholder'));

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useInfiniteQuery({
    queryKey: [...config.queryKey, 'async-faceted', debouncedSearch, activeOnly],
    queryFn: async ({ pageParam }) => {
      const result = await config.fetchPage({
        page: pageParam,
        pageSize: PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {})
      });
      const items = activeOnly
        ? result.items.filter((item) => item.isActive !== false && item.is_active !== false)
        : result.items;
      return { ...result, items };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const loaded = last.page * last.pageSize;
      return loaded < last.total ? last.page + 1 : undefined;
    },
    enabled: open,
    staleTime: 60_000
  });

  const options = React.useMemo(() => {
    const loaded = query.data?.pages.flatMap((page) => page.items) ?? [];
    const seen = new Set<string>();
    const unique: { label: string; value: string }[] = [];
    for (const item of loaded) {
      if (!item?.id || seen.has(item.id)) continue;
      seen.add(item.id);
      unique.push({ label: item.name, value: item.id });
    }
    return unique;
  }, [query.data]);

  const columnFilterValue = column?.getFilterValue();
  const selectedValues = React.useMemo(
    () => new Set(Array.isArray(columnFilterValue) ? (columnFilterValue as string[]) : []),
    [columnFilterValue]
  );

  const onItemSelect = React.useCallback(
    (value: string, label: string, isSelected: boolean) => {
      if (!column) return;

      if (multiple) {
        const next = new Set(selectedValues);
        if (isSelected) next.delete(value);
        else next.add(value);
        const filterValues = Array.from(next);
        column.setFilterValue(filterValues.length ? filterValues : undefined);
      } else {
        column.setFilterValue(isSelected ? undefined : [value]);
        setOpen(false);
      }

      if (!isSelected) {
        setLabelCache((prev) => (prev[value] === label ? prev : { ...prev, [value]: label }));
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

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch('');
  };

  const onListScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    if (nearBottom && query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  };

  const selectedLabels = React.useMemo(() => {
    return Array.from(selectedValues).map((value) => {
      const fromOptions = options.find((option) => option.value === value)?.label;
      return {
        value,
        label: fromOptions ?? labelCache[value] ?? value
      };
    });
  }, [selectedValues, options, labelCache]);

  const FilterIcon = column?.columnDef.meta?.icon ?? Icons.filter;

  const triggerLabel =
    selectedLabels.length === 0
      ? title
      : selectedLabels.length === 1
        ? selectedLabels[0]?.label
        : `${selectedLabels.length} ${t('common.selected')}`;

  const list = (
    <Command shouldFilter={false}>
      <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
      <CommandList
        className={cn(isSheet ? 'max-h-[min(50dvh,22rem)]' : 'max-h-64')}
        onScroll={onListScroll}
      >
        {query.isLoading && options.length === 0 ? (
          <ComboboxListSkeleton />
        ) : (
          <>
            <CommandEmpty>{t('table.noResults')}</CommandEmpty>
            <CommandGroup className='p-0.5 [&_[cmdk-group-items]]:space-y-1'>
              {options.map((option, index) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={`${option.value}-${index}`}
                    value={option.value}
                    keywords={[option.label]}
                    onSelect={() => onItemSelect(option.value, option.label, isSelected)}
                    className='my-0.5 flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm'
                  >
                    <div
                      className={cn(
                        'border-primary flex size-4 items-center justify-center rounded-sm border',
                        isSelected ? 'bg-primary' : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Icons.check />
                    </div>
                    <span className='truncate'>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {query.isFetchingNextPage ? (
              <div className='space-y-1 px-2 py-2' aria-busy='true'>
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-8 w-[85%]' />
              </div>
            ) : null}
            {selectedValues.size > 0 ? (
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
            ) : null}
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
        <Sheet open={open} onOpenChange={handleOpenChange}>
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
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={<Button variant='outline' size='sm' className='h-8 gap-1.5 border-dashed' />}
      >
        {selectedValues.size > 0 ? (
          <DataTableFilterClear title={title} onReset={onReset} />
        ) : (
          <FilterIcon className='size-4' />
        )}
        {title}
        {selectedValues.size > 0 ? (
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
                selectedLabels.map((item, index) => (
                  <Badge
                    variant='secondary'
                    key={`${item.value}-${index}`}
                    className='rounded-sm px-1 font-normal'
                  >
                    {item.label}
                  </Badge>
                ))
              )}
            </div>
          </>
        ) : null}
      </PopoverTrigger>
      <PopoverContent className='w-56 p-0' align='start' sideOffset={6}>
        {list}
      </PopoverContent>
    </Popover>
  );
}
