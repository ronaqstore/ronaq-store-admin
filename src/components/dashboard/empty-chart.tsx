'use client';

import { IconChartBar, IconPlus } from '@tabler/icons-react';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useT } from '@/i18n/use-t';
import type { EmptyChartProps } from '@/types/charts';

export function EmptyChart({
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyChartProps) {
  const t = useT();
  const displayTitle = title ?? t('dashboard.noData');

  return (
    <div className='flex h-64 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
      <div className='bg-muted/50 mb-3 flex h-12 w-12 items-center justify-center rounded-full'>
        <IconChartBar className='text-muted-foreground h-6 w-6' />
      </div>
      <h4 className='text-sm font-semibold'>{displayTitle}</h4>
      {description ? (
        <p className='text-muted-foreground mt-1 max-w-sm text-xs'>
          {description}
        </p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className={buttonVariants({
            variant: 'outline',
            size: 'sm',
            className: 'mt-4',
          })}
        >
          <IconPlus className='me-1.5 h-3.5 w-3.5' />
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
