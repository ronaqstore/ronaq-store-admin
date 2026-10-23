'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface DataTableSkeletonProps extends React.ComponentProps<'div'> {
  columnCount?: number;
  rowCount?: number;
  filterCount?: number;
  cellWidths?: string[];
  withViewOptions?: boolean;
  withPagination?: boolean;
  shrinkZero?: boolean;
  mode?: 'auto' | 'list' | 'cards' | 'compact' | 'full';
}

export function DataTableSkeleton({
  columnCount = 4,
  rowCount = 3,
  filterCount = 0,
  cellWidths = ['auto'],
  withViewOptions = true,
  withPagination = true,
  shrinkZero = false,
  mode = 'auto',
  className,
  ...props
}: DataTableSkeletonProps) {
  const cozyCellWidths = Array.from(
    { length: columnCount },
    (_, index) => cellWidths[index % cellWidths.length] ?? 'auto'
  );

  const showList = mode === 'list' || mode === 'auto';
  const showCards = mode === 'cards' || mode === 'auto';
  const showCompact = mode === 'compact';
  const showFull = mode === 'full' || mode === 'auto';

  return (
    <div
      data-slot='data-table-skeleton'
      className={cn('flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3', className)}
      aria-busy='true'
      aria-label='Loading table data'
      {...props}
    >
      {showList ? (
        <div
          data-slot='list-skeleton'
          className={cn(
            'min-h-0 flex-1 flex-col gap-3',
            mode === 'auto' ? 'flex min-[640px]:hidden' : 'flex'
          )}
        >
          <div className='flex items-center gap-2'>
            <Skeleton className='h-10 flex-1 rounded-md' />
            <Skeleton className='size-10 shrink-0 rounded-md' />
          </div>
          <div className='divide-border divide-y overflow-hidden rounded-lg border border-border bg-card'>
            {Array.from({ length: rowCount }).map((_, i) => (
              <div key={i} className='flex min-h-16 items-center gap-3 px-3 py-2.5'>
                <Skeleton className='size-10 shrink-0 rounded-lg bg-muted/70' />
                <div className='flex min-w-0 flex-1 flex-col gap-2'>
                  <Skeleton className={cn('h-4 rounded bg-muted/80', i % 2 === 0 ? 'w-40' : 'w-28')} />
                  <Skeleton className='h-3 w-16 rounded bg-muted/50' />
                </div>
                <Skeleton className='h-5 w-14 shrink-0 rounded-full bg-muted/60' />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showCards ? (
        <div
          data-slot='cards-skeleton'
          className={cn(
            'min-h-0 flex-1 flex-col gap-3',
            mode === 'auto' ? 'hidden min-[640px]:max-[1023px]:flex' : 'flex'
          )}
        >
          <div className='flex items-center gap-2'>
            <Skeleton className='h-10 flex-1 rounded-md' />
            <Skeleton className='h-10 w-24 shrink-0 rounded-md' />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            {Array.from({ length: Math.max(rowCount, 4) }).map((_, i) => (
              <div
                key={i}
                className='overflow-hidden rounded-[var(--radius)] border border-border bg-card p-3'
              >
                <Skeleton className='mb-3 aspect-square w-full rounded-lg' />
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='mt-2 h-3 w-1/2' />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showCompact ? (
        <div data-slot='compact-skeleton' className='flex min-h-0 flex-1 flex-col gap-3'>
          <div className='flex items-center justify-between gap-2'>
            <Skeleton className='h-10 w-64 rounded-md' />
            <div className='flex items-center gap-2'>
              <Skeleton className='h-9 w-20 rounded-md' />
              <Skeleton className='h-9 w-28 rounded-md' />
            </div>
          </div>
          <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card'>
            <Table containerClassName='min-h-0 flex-1 overflow-hidden'>
              <TableHeader className='bg-background sticky top-0 z-10 shadow-[0_1px_0_0_var(--border)]'>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='w-[45%]'>
                    <Skeleton className='h-4 w-24' />
                  </TableHead>
                  <TableHead className='w-[40%]'>
                    <Skeleton className='h-4 w-20' />
                  </TableHead>
                  <TableHead className='w-12 text-end'>
                    <Skeleton className='ms-auto size-4 rounded' />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: rowCount }).map((_, i) => (
                  <TableRow key={i} className='hover:bg-transparent'>
                    <TableCell>
                      <Skeleton className={cn('h-4 rounded', i % 2 === 0 ? 'w-44' : 'w-32')} />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-5 w-16 rounded-full bg-muted/60' />
                    </TableCell>
                    <TableCell className='text-end'>
                      <Skeleton className='ms-auto size-7 rounded-md' />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {withPagination ? (
            <div className='flex items-center justify-between px-1 py-1'>
              <Skeleton className='h-4 w-28' />
              <div className='flex items-center gap-1.5'>
                <Skeleton className='size-8 rounded-md' />
                <Skeleton className='size-8 rounded-md' />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {showFull ? (
        <div
          data-slot='desktop-skeleton'
          className={cn(
            'min-h-0 flex-1 flex-col gap-3',
            mode === 'auto' ? 'hidden min-[1024px]:flex' : 'flex'
          )}
        >
          <div className='flex items-center justify-between gap-4'>
            <div className='flex flex-1 items-center gap-2'>
              <Skeleton className='h-10 w-72 rounded-md' />
              {filterCount > 0
                ? Array.from({ length: filterCount }).map((_, i) => (
                    <Skeleton key={i} className='h-10 w-28 rounded-md border-dashed' />
                  ))
                : null}
            </div>
            <div className='flex items-center gap-2'>
              {withViewOptions ? <Skeleton className='h-9 w-20 rounded-md' /> : null}
              <Skeleton className='h-9 w-28 rounded-md' />
            </div>
          </div>
          <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card'>
            <Table containerClassName='min-h-0 flex-1 overflow-hidden'>
              <TableHeader className='bg-background sticky top-0 z-10 shadow-[0_1px_0_0_var(--border)]'>
                <TableRow className='hover:bg-transparent'>
                  {Array.from({ length: columnCount }).map((_, j) => (
                    <TableHead
                      key={j}
                      className={shrinkZero ? 'shrink-0' : undefined}
                      style={
                        cozyCellWidths[j] !== 'auto'
                          ? { width: cozyCellWidths[j], minWidth: cozyCellWidths[j] }
                          : undefined
                      }
                    >
                      <Skeleton className='h-4 w-24' />
                    </TableHead>
                  ))}
                  <TableHead className='w-12 text-end'>
                    <Skeleton className='ms-auto size-4 rounded' />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: rowCount }).map((_, i) => (
                  <TableRow key={i} className='hover:bg-transparent'>
                    {Array.from({ length: columnCount }).map((_, j) => (
                      <TableCell
                        key={j}
                        className={shrinkZero ? 'shrink-0' : undefined}
                        style={
                          cozyCellWidths[j] !== 'auto'
                            ? { width: cozyCellWidths[j], minWidth: cozyCellWidths[j] }
                            : undefined
                        }
                      >
                        {j === 1 ? (
                          <Skeleton className='h-5 w-16 rounded-full bg-muted/60' />
                        ) : (
                          <Skeleton
                            className={cn('h-4', j === 0 ? (i % 2 === 0 ? 'w-40' : 'w-28') : 'w-3/5')}
                          />
                        )}
                      </TableCell>
                    ))}
                    <TableCell className='text-end'>
                      <Skeleton className='ms-auto size-7 rounded-md' />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {withPagination ? (
            <div className='flex items-center justify-between px-1 py-1'>
              <Skeleton className='h-4 w-40' />
              <div className='flex items-center gap-6'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-8 w-16 rounded-md' />
                </div>
                <Skeleton className='h-4 w-24' />
                <div className='flex items-center gap-1.5'>
                  <Skeleton className='size-8 rounded-md' />
                  <Skeleton className='size-8 rounded-md' />
                  <Skeleton className='size-8 rounded-md' />
                  <Skeleton className='size-8 rounded-md' />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
