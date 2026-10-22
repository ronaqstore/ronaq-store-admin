'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { ComboboxListSkeleton } from '@/components/common/combobox-list-skeleton';
import { cn } from '@/lib/utils';
import type { EntityComboboxItem, EntityComboboxProps } from '@/types';

export function EntityCombobox<T extends EntityComboboxItem = EntityComboboxItem>({
  value,
  items,
  selectedItem,
  onSelect,
  placeholder = '',
  searchPlaceholder = '',
  search,
  onSearchChange,
  isLoading,
  emptyText = '',
  clearSelectionTitle = '',
  disabled,
  className,
  renderTriggerLeading,
  onAddNewClick,
  addNewLabel,
  onOpenChange
}: EntityComboboxProps<T>) {
  const [open, setOpen] = useState(false);

  const currentItem = selectedItem ?? items.find((item) => item.id === value) ?? null;

  const handleSelect = (item: T) => {
    onSelect(item);
    setOpen(false);
    onOpenChange?.(false);
    onSearchChange('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    onSearchChange('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
    if (!nextOpen) onSearchChange('');
  };

  const handleAddNew = () => {
    setOpen(false);
    onAddNewClick?.();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='outline'
            role='combobox'
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'h-10 w-full min-w-0 justify-between bg-background text-sm font-normal text-foreground',
              !currentItem && 'text-muted-foreground',
              className
            )}
          />
        }
      >
        <span className='flex min-w-0 flex-1 items-center gap-2 truncate text-start text-sm font-normal text-foreground'>
          {renderTriggerLeading}
          {currentItem ? (
            <span className='flex min-w-0 items-center gap-2 truncate' title={currentItem.label}>
              <span className='truncate font-normal text-foreground'>{currentItem.label}</span>
              {currentItem.subLabel ? (
                <span className='shrink-0 text-xs text-muted-foreground'>({currentItem.subLabel})</span>
              ) : null}
            </span>
          ) : (
            <span className='truncate'>{placeholder}</span>
          )}
        </span>

        <span className='flex items-center gap-1.5 ms-2'>
          {currentItem && !disabled ? (
            <span
              role='button'
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(null);
                }
              }}
              className='cursor-pointer rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground'
              title={clearSelectionTitle}
            >
              <Icons.close className='size-3.5' />
            </span>
          ) : null}
          <Icons.chevronDown className='size-4 shrink-0 text-muted-foreground opacity-70' />
        </span>
      </PopoverTrigger>

      <PopoverContent
        align='start'
        className='z-50 w-[var(--radix-popover-trigger-width)] min-w-0 max-w-[min(100vw-2rem,24rem)] p-0 shadow-lg sm:min-w-[320px]'
      >
        <div className='p-2 pb-1.5'>
          <div className='relative flex items-center overflow-hidden rounded-md border border-border bg-muted/40'>
            <Icons.search className='pointer-events-none absolute inset-s-2.5 size-4 text-muted-foreground' />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className='h-9 border-0 bg-transparent ps-8 pe-8 text-sm font-normal text-foreground shadow-none outline-none ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0'
              autoFocus
            />
            {search ? (
              <button
                type='button'
                onClick={() => onSearchChange('')}
                className='absolute inset-e-2.5 text-muted-foreground hover:text-foreground'
              >
                <Icons.close className='size-3.5' />
              </button>
            ) : null}
          </div>
        </div>

        <div className='max-h-60 space-y-1.5 overflow-y-auto p-1 text-sm'>
          {isLoading && items.length === 0 ? (
            <ComboboxListSkeleton />
          ) : items.length === 0 ? (
            <div className='py-6 text-center text-sm font-normal text-muted-foreground'>
              {emptyText}
            </div>
          ) : (
            items.map((item, index) => {
              const isSelected = (currentItem?.id ?? value) === item.id;
              return (
                <div
                  key={`${item.id}-${index}`}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    'flex min-w-0 cursor-pointer items-center justify-between gap-2 overflow-hidden rounded-md px-2.5 py-2 text-sm transition-colors',
                    isSelected
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <div className='min-w-0 flex-1 space-y-0.5'>
                    <span className='block truncate font-normal text-foreground' title={item.label}>
                      {item.label}
                    </span>
                    {item.subLabel ? (
                      <span className='block truncate text-xs text-muted-foreground' title={item.subLabel}>
                        {item.subLabel}
                      </span>
                    ) : null}
                  </div>
                  {isSelected && <Icons.check className='size-4 shrink-0 text-primary' />}
                </div>
              );
            })
          )}
        </div>

        {onAddNewClick && addNewLabel ? (
          <div className='border-t border-border/60 p-1'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={handleAddNew}
              className='w-full justify-start text-xs font-normal text-primary hover:bg-primary/10'
            >
              <Icons.add className='size-3.5 me-1.5' />
              <span>{addNewLabel}</span>
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
