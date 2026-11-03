'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { FloatingActionButtonProps } from '@/types';
export type { FloatingActionButtonProps };

export function FloatingActionButton({ label, onClick, className }: FloatingActionButtonProps) {
  return (
    <Button
      type='button'
      size='icon'
      aria-label={label}
      onClick={onClick}
      className={cn(
        'fixed inset-e-4 z-30 size-14 rounded-full shadow-lg',
        'bottom-[calc(4.75rem+max(0.5rem,env(safe-area-inset-bottom)))]',
        'md:hidden',
        className
      )}
    >
      <Icons.add className='size-6' />
    </Button>
  );
}
