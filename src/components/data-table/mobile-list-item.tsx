'use client';

import Image from 'next/image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/constants/placeholders';
import { cn } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import type { MobileListItemProps } from './types';

function initials(text: string): string {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0] ?? '';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const second = parts[1] ?? '';
  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase();
}

export function MobileListItem<TData>({
  row,
  config,
  onOpen,
  actionsSlot,
  density = 'list'
}: MobileListItemProps<TData>) {
  const title = config.title(row);
  const subtitle = config.subtitle?.(row);
  const badge = config.badge?.(row);
  const value = config.value?.(row);
  const valueLabel =
    typeof config.valueLabel === 'function' ? config.valueLabel(row) : config.valueLabel;
  const metaItems = (config.meta ?? [])
    .map((fn) => fn(row))
    .filter((node) => node != null && node !== false && node !== '');
  const aria = config.ariaLabel?.(row) ?? (typeof title === 'string' ? title : undefined);
  const imageUrl = config.imageUrl?.(row)?.trim() || null;

  const LeadingIcon = config.leadingIcon ?? Icons.box;
  const isCard = density === 'card';

  return (
    <div
      className={cn(
        'relative flex items-stretch gap-2',
        isCard ? 'min-h-20 flex-col px-3 py-3' : 'min-h-16 px-3 py-2.5'
      )}
    >
      <button
        type='button'
        onClick={onOpen}
        aria-label={aria}
        className={cn(
          'flex min-w-0 flex-1 text-start',
          isCard ? 'flex-col gap-2.5' : 'items-start gap-3',
          'rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
        )}
      >
        {config.leading === 'avatar' ? (
          <Avatar className={cn('shrink-0', isCard ? 'size-12' : 'size-10')}>
            <AvatarFallback className='bg-muted text-muted-foreground text-xs font-medium'>
              {initials(typeof title === 'string' ? title : String(aria ?? ''))}
            </AvatarFallback>
          </Avatar>
        ) : config.leading === 'thumbnail' ? (
          <div
            className={cn(
              'relative shrink-0 overflow-hidden rounded-lg border bg-muted',
              isCard ? 'aspect-square w-full' : 'size-10'
            )}
          >
            <Image
              src={imageUrl || PLACEHOLDER_PRODUCT_IMAGE}
              alt=''
              fill
              unoptimized
              className='object-contain p-0.5'
              sizes={isCard ? '200px' : '40px'}
            />
          </div>
        ) : config.leading === 'icon' ? (
          <div
            className={cn(
              'bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-lg',
              isCard ? 'size-12' : 'size-10'
            )}
          >
            <LeadingIcon className={isCard ? 'size-6' : 'size-5'} />
          </div>
        ) : null}

        <div className='min-w-0 flex-1'>
          <div
            className={cn(
              'flex min-w-0 gap-3',
              isCard ? 'flex-col items-stretch' : 'items-start justify-between'
            )}
          >
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-semibold'>{title}</p>
              {subtitle != null ? (
                <p className='text-muted-foreground truncate text-xs'>{subtitle}</p>
              ) : null}
              {(metaItems.length > 0 || badge) && (
                <div className='mt-1 flex min-w-0 flex-wrap items-center gap-1.5'>
                  {metaItems.slice(0, 2).map((item, i) => (
                    <span key={i} className='text-muted-foreground text-[11px]'>
                      {i > 0 ? <span className='me-1.5'>·</span> : null}
                      {item}
                    </span>
                  ))}
                  {badge ? (
                    <StatusBadge
                      status={badge.status ?? badge.label}
                      label={badge.label}
                      tone={badge.tone}
                    />
                  ) : null}
                </div>
              )}
            </div>

            {value != null ? (
              <div
                className={cn(
                  'shrink-0',
                  isCard ? 'flex items-baseline justify-between gap-2' : 'ms-1 w-[5.5rem] text-end sm:w-24'
                )}
              >
                <p
                  className={cn(
                    'truncate text-sm font-semibold tabular-nums',
                    !isCard && 'text-end',
                    config.valueClassName?.(row)
                  )}
                >
                  {value}
                </p>
                {valueLabel ? (
                  <p className='text-muted-foreground truncate text-[10px]'>{valueLabel}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </button>

      {actionsSlot ? (
        <div className='flex shrink-0 items-center self-center'>{actionsSlot}</div>
      ) : null}
    </div>
  );
}
