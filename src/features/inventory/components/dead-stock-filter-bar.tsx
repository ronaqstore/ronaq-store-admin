'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import type { DeadStockFilterBarProps } from '@/types/inventory';
export type { DeadStockFilterBarProps };

export function DeadStockFilterBar({
  searchTerm,
  onSearchChange,
  onClearSearch,
  conditionFilter,
  onConditionChange,
  sortBy,
  onSortChange,
  isFiltered,
  onResetFilters
}: DeadStockFilterBarProps) {
  const t = useTranslations('deadStock');

  return (
    <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card border rounded-lg p-3'>
      <div className='relative flex-1'>
        <Icons.search className='absolute inset-s-3 top-2.5 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder={t('filters.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className='ps-9'
        />
        {searchTerm && (
          <button
            type='button'
            onClick={onClearSearch}
            className='absolute inset-e-2.5 top-2.5 text-muted-foreground hover:text-foreground text-xs p-1'
            title={t('filters.clearSearch')}
          >
            <Icons.close className='h-3.5 w-3.5' />
          </button>
        )}
      </div>

      <div className='flex items-center gap-2 flex-wrap'>
        <Select value={conditionFilter} onValueChange={onConditionChange}>
          <SelectTrigger className='w-[130px]'>
            <SelectValue placeholder={t('filters.condition')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>{t('filters.allConditions')}</SelectItem>
            <SelectItem value='NEW'>{t('filters.conditionNew')}</SelectItem>
            <SelectItem value='USED'>{t('filters.conditionUsed')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder={t('filters.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ageDesc'>{t('filters.sortAgeDesc')}</SelectItem>
            <SelectItem value='ageAsc'>{t('filters.sortAgeAsc')}</SelectItem>
            <SelectItem value='costDesc'>{t('filters.sortCostDesc')}</SelectItem>
            <SelectItem value='costAsc'>{t('filters.sortCostAsc')}</SelectItem>
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onResetFilters}
            className='text-xs h-9 text-muted-foreground hover:text-foreground'
          >
            <Icons.close className='me-1.5 h-3.5 w-3.5' />
            <span>{t('filters.reset')}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
