'use client';

import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import type { DeadStockPaginationProps } from '@/types/inventory';

export function DeadStockPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPagePrevious,
  onPageNext
}: DeadStockPaginationProps) {
  const t = useTranslations('deadStock');

  if (totalPages <= 1) return null;

  return (
    <div className='flex items-center justify-between border-t p-3 text-xs text-muted-foreground bg-muted/20'>
      <div>
        {t('pagination.showing', {
          start: (page - 1) * pageSize + 1,
          end: Math.min(page * pageSize, total),
          total
        })}
      </div>
      <div className='flex items-center gap-1'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-7 px-2 text-xs'
          onClick={onPagePrevious}
          disabled={page <= 1}
        >
          <Icons.chevronLeft className='h-3.5 w-3.5' />
        </Button>
        <span className='px-2 font-mono'>
          {page} / {totalPages}
        </span>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-7 px-2 text-xs'
          onClick={onPageNext}
          disabled={page >= totalPages}
        >
          <Icons.chevronRight className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  );
}
