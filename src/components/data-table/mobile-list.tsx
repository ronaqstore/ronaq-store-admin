'use client';

import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import { MobileListItem } from './mobile-list-item';
import { RecordDetail } from './record-detail';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { MobileListProps } from './types';

function ListRowSkeleton() {
  return (
    <div className='flex min-h-16 items-center gap-3 px-3 py-2.5'>
      <Skeleton className='size-10 shrink-0 rounded-lg' />
      <div className='flex min-w-0 flex-1 flex-col gap-2'>
        <Skeleton className='h-4 w-2/3 max-w-[180px]' />
        <Skeleton className='h-3 w-1/3 max-w-[96px]' />
      </div>
      <Skeleton className='h-5 w-14 shrink-0 rounded-full' />
    </div>
  );
}

function CardItemSkeleton() {
  return (
    <div className='overflow-hidden rounded-[var(--radius)] border border-border bg-card p-3'>
      <Skeleton className='mb-3 aspect-square w-full rounded-lg' />
      <Skeleton className='h-4 w-3/4' />
      <Skeleton className='mt-2 h-3 w-1/2' />
    </div>
  );
}

export function MobileList<TData>({
  table,
  mobileItem,
  detail,
  layout = 'list',
  preferNavigate = true,
  isLoading,
  skeletonRowCount,
  onNavigate,
  onRowClick
}: MobileListProps<TData>) {
  const t = useTranslations();
  const [active, setActive] = React.useState<Row<TData> | null>(null);
  const rows = table.getRowModel().rows;
  const isCards = layout === 'cards';

  const openRow = (row: Row<TData>) => {
    if (onRowClick) {
      onRowClick(row);
      return;
    }
    if (detail.mode === 'page' && preferNavigate && detail.href && onNavigate) {
      onNavigate(detail.href(row.original));
      return;
    }
    setActive(row);
  };

  if (isLoading) {
    const count =
      (rows.length > 0 ? rows.length : null) ??
      (table.options.data?.length > 0 ? table.options.data.length : null) ??
      skeletonRowCount ??
      3;

    if (isCards) {
      return (
        <div className='grid grid-cols-2 gap-3' aria-busy>
          {Array.from({ length: count }).map((_, i) => (
            <CardItemSkeleton key={i} />
          ))}
        </div>
      );
    }

    return (
      <div
        className='divide-y divide-border overflow-hidden rounded-[var(--radius)] border border-border bg-card'
        aria-busy
      >
        {Array.from({ length: count }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className='text-muted-foreground flex min-h-40 items-center justify-center rounded-[var(--radius)] border border-border text-sm'>
        {t('table.noResults')}
      </div>
    );
  }

  return (
    <>
      <ul
        className={cn(
          isCards
            ? 'grid grid-cols-2 gap-3'
            : 'overflow-hidden rounded-[var(--radius)] border border-border'
        )}
      >
        {rows.map((row) => (
          <li
            key={row.id}
            className={cn(
              isCards
                ? 'overflow-hidden rounded-[var(--radius)] border border-border bg-card'
                : 'border-b border-border last:border-b-0'
            )}
          >
            <MobileListItem
              row={row.original}
              config={mobileItem}
              density={isCards ? 'card' : 'list'}
              onOpen={() => openRow(row)}
            />
          </li>
        ))}
      </ul>

      <RecordDetail
        open={active != null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
        presentation='sheet'
        data={active?.original ?? null}
        detail={detail}
      />
    </>
  );
}
