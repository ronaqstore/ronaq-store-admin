import { cn } from '@/lib/utils';
import type { TruncateTextProps } from '@/types/common';

export function TruncateText({ children, className, title, lines = 1 }: TruncateTextProps) {
  const autoTitle = typeof children === 'string' || typeof children === 'number' ? String(children) : undefined;

  return (
    <span
      title={title ?? autoTitle}
      className={cn(
        'min-w-0 max-w-full',
        lines === 1 && 'block truncate',
        lines === 2 && 'line-clamp-2 wrap-break-word',
        lines === 3 && 'line-clamp-3 wrap-break-word',
        className
      )}
    >
      {children}
    </span>
  );
}
