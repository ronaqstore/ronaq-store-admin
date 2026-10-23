'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Icons } from '@/components/icons';
import { ComboboxListSkeleton } from '@/components/common/combobox-list-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/use-t';
import type { NamedEntity, InfiniteEntitySelectProps } from '@/types';
export type { NamedEntity, InfiniteEntitySelectProps };

const PAGE_SIZE = 20;
const EMPTY_EXTRA_ITEMS: NamedEntity[] = [];
const LIST_ID = 'infinite-entity-select-list';

export function InfiniteEntitySelect<T extends NamedEntity>({
  value,
  onValueChange,
  queryKey,
  fetchPage,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  selectedLabel,
  activeOnly = true,
  disabled,
  className,
  extraItems = EMPTY_EXTRA_ITEMS
}: InfiniteEntitySelectProps<T>) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [labelCache, setLabelCache] = React.useState<Record<string, string>>({});

  const effPlaceholder = placeholder ?? t('common.select');
  const effSearchPlaceholder = searchPlaceholder ?? t('nav.searchPlaceholder');
  const effEmptyMessage = emptyMessage ?? t('table.noResults');

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useInfiniteQuery({
    queryKey: [...queryKey, 'infinite-select', debouncedSearch, activeOnly],
    queryFn: async ({ pageParam }) => {
      const result = await fetchPage({
        page: pageParam,
        limit: PAGE_SIZE,
        pageSize: PAGE_SIZE,
        ...(activeOnly ? { isActive: true, is_active: 'true' } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {})
      });
      const items = activeOnly
        ? result.items.filter(
            (item) => item.isActive !== false && item.is_active !== false
          )
        : result.items;
      return { ...result, items };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const loaded = last.page * last.limit;
      return loaded < last.total ? last.page + 1 : undefined;
    },
    enabled: open
  });

  const items = React.useMemo(() => {
    const loaded = query.data?.pages.flatMap((page) => page.items) ?? [];
    const q = debouncedSearch.toLowerCase();
    const extras = (
      q ? extraItems.filter((item) => item.name.toLowerCase().includes(q)) : extraItems
    ) as T[];
    const seen = new Set<string>();
    const unique: T[] = [];
    for (const item of [...extras, ...loaded]) {
      if (!item?.id || seen.has(item.id)) continue;
      seen.add(item.id);
      unique.push(item);
    }
    return unique;
  }, [query.data, extraItems, debouncedSearch]);

  const displayLabel = value
    ? (selectedLabel ??
      labelCache[value] ??
      items.find((item) => item.id === value)?.name ??
      t('common.selected'))
    : effPlaceholder;

  const onListScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    if (nearBottom && query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch('');
  };

  const handleSelectItem = (item: T) => {
    const next = value === item.id ? '' : item.id;
    onValueChange(next, next ? item : null);
    if (next) {
      setLabelCache((prev) =>
        prev[item.id] === item.name ? prev : { ...prev, [item.id]: item.name }
      );
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='outline'
            role='combobox'
            disabled={disabled}
            aria-expanded={open}
            aria-controls={LIST_ID}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-muted-foreground',
              className
            )}
          />
        }
      >
        <span className='truncate'>{displayLabel}</span>
        <Icons.chevronsUpDown className='ms-2 size-4 shrink-0 opacity-50' />
      </PopoverTrigger>
      <PopoverContent className='w-(--anchor-width) p-0' align='start'>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={effSearchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList id={LIST_ID} className='pt-1' onScroll={onListScroll}>
            {query.isLoading && items.length === 0 ? (
              <ComboboxListSkeleton />
            ) : (
              <>
                <CommandEmpty>{effEmptyMessage}</CommandEmpty>
                <CommandGroup className='[&_[cmdk-group-items]]:space-y-1.5'>
                  {items.map((item, index) => (
                    <CommandItem
                      key={`${item.id}-${index}`}
                      value={item.id}
                      keywords={[item.name]}
                      data-checked={value === item.id || undefined}
                      onSelect={() => handleSelectItem(item)}
                      className='py-2'
                    >
                      <Icons.check
                        className={cn(
                          'me-2 size-4',
                          value === item.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className='truncate'>{item.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {query.isFetchingNextPage ? (
                  <div className='space-y-1.5 px-2 py-2' aria-busy='true'>
                    <Skeleton className='h-9 w-full' />
                    <Skeleton className='h-9 w-[85%]' />
                  </div>
                ) : null}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
