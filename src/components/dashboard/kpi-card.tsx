'use client';

import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconHelpCircle,
} from '@tabler/icons-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Link } from '@/i18n/navigation';
import { formatPercent, formatPkrFull } from '@/lib/dashboard/formatters';
import { cn } from '@/lib/utils';
import type { KpiCardProps, MiniSparklineProps } from '@/types/charts';

function MiniSparkline({
  points,
  color = 'currentColor',
}: MiniSparklineProps) {
  if (!points || points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 80;
  const height = 28;
  const padding = 2;

  const coords = points.map((val, idx) => {
    const x = padding + (idx / (points.length - 1)) * (width - 2 * padding);
    const y =
      height - padding - ((val - min) / range) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylinePoints = coords.join(' ');
  const lastCoord = coords[coords.length - 1].split(',');
  const lastX = Number(lastCoord[0]);
  const lastY = Number(lastCoord[1]);

  return (
    <svg
      width={width}
      height={height}
      className='overflow-visible'
      aria-hidden='true'
    >
      <polyline
        fill='none'
        stroke={color}
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        points={polylinePoints}
      />
      <circle cx={lastX} cy={lastY} r='2.5' fill={color} />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  tooltip,
  change,
  sparkline,
  sparklineColor = 'var(--primary)',
  href,
  className,
}: KpiCardProps) {
  let isPositive = false;
  let isNegative = false;
  let trendClass = 'text-muted-foreground bg-muted/50';

  if (change) {
    const isGood = change.isInverse
      ? change.percentage < 0
      : change.percentage > 0;
    const isBad = change.isInverse
      ? change.percentage > 0
      : change.percentage < 0;

    isPositive = change.percentage > 0;
    isNegative = change.percentage < 0;

    if (isGood) {
      trendClass =
        'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40';
    } else if (isBad) {
      trendClass =
        'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40';
    }
  }

  const changeText = change
    ? `${formatPercent(change.percentage)}${change.absolute !== undefined ? ` (${formatPkrFull(change.absolute)})` : ''}`
    : '';

  const ariaLabel = `${label}: ${value}${changeText ? `, ${changeText}` : ''}`;

  const content = (
    <Card
      className={cn(
        'group transition-all duration-200',
        href ? 'hover:border-primary/50 hover:shadow-sm cursor-pointer' : '',
        className,
      )}
    >
      <CardContent className='p-4 sm:p-5'>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-muted-foreground text-xs font-medium tracking-tight'>
            {label}
          </span>
          {tooltip ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  type='button'
                  className='text-muted-foreground/70 hover:text-foreground inline-flex items-center'
                  aria-label={label}
                >
                  <IconHelpCircle className='h-3.5 w-3.5' />
                </TooltipTrigger>
                <TooltipContent side='top' className='max-w-xs text-xs'>
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>

        <div className='mt-2 flex items-baseline justify-between gap-2'>
          <span className='text-2xl font-bold tracking-tight tabular-nums sm:text-3xl'>
            {value}
          </span>
        </div>

        <div className='mt-3 flex items-center justify-between gap-2'>
          {change ? (
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums',
                trendClass,
              )}
            >
              {isPositive ? (
                <IconArrowUpRight className='h-3 w-3 shrink-0' />
              ) : isNegative ? (
                <IconArrowDownRight className='h-3 w-3 shrink-0' />
              ) : null}
              <span>{formatPercent(change.percentage)}</span>
            </div>
          ) : (
            <div />
          )}

          {sparkline && sparkline.length > 1 ? (
            <div className='opacity-80 transition-opacity group-hover:opacity-100'>
              <MiniSparkline points={sparkline} color={sparklineColor} />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className='block' aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return <div aria-label={ariaLabel}>{content}</div>;
}
