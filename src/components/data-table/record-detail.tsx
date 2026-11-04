'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { StatusBadge } from './status-badge';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { DetailAction, RecordDetailProps } from './types';

export function RecordDetail<TData>({
  open,
  onOpenChange,
  presentation,
  data,
  detail
}: RecordDetailProps<TData>) {
  const t = useTranslations();
  if (!data) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side={presentation === 'side' ? 'right' : 'bottom'} />
      </Sheet>
    );
  }

  const title = detail.title(data);
  const badge = detail.badge?.(data);
  const value = detail.value?.(data);
  const sections = detail.sections(data);
  const allActions = detail.actions?.(data) ?? [];
  const barActions: DetailAction[] = [];
  const overflowActions: DetailAction[] = [];

  for (const action of allActions) {
    if (action.placement === 'more') {
      overflowActions.push(action);
    } else if (action.placement === 'bar') {
      barActions.push(action);
    } else if (allActions.length > 3 && action.variant === 'destructive') {
      overflowActions.push(action);
    } else if (barActions.length < 3) {
      barActions.push(action);
    } else {
      overflowActions.push(action);
    }
  }

  const side = presentation === 'side' ? 'right' : 'bottom';

  const handleActionClick = (action: DetailAction) => {
    action.onClick();
    onOpenChange(false);
  };

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (
      !nextOpen &&
      typeof document !== 'undefined' &&
      document.querySelector('[data-image-lightbox]')
    ) {
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          'flex flex-col gap-0',
          presentation === 'sheet' &&
            'max-h-[85dvh] rounded-t-[var(--radius)] pb-[max(0.5rem,env(safe-area-inset-bottom))]',
          presentation === 'side' && 'w-full sm:max-w-md'
        )}
      >
        {presentation === 'sheet' ? (
          <div className='bg-muted mx-auto mt-1 mb-2 h-1 w-10 shrink-0 rounded-full' aria-hidden />
        ) : null}

        <SheetHeader className='border-b border-border'>
          <SheetTitle className='pe-8'>{title}</SheetTitle>
          <SheetDescription className='sr-only'>{t('table.details')}</SheetDescription>
          <div className='flex flex-wrap items-center gap-2 pt-1'>
            {badge ? (
              <StatusBadge
                status={badge.status ?? badge.label}
                label={badge.label}
                tone={badge.tone}
              />
            ) : null}
            {value != null ? (
              <span className='text-base font-semibold tabular-nums'>{value}</span>
            ) : null}
          </div>
        </SheetHeader>

        <div className='no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4'>
          {sections.map((section, si) => (
            <section key={si} className='space-y-2'>
              {section.title ? (
                <h3 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                  {section.title}
                </h3>
              ) : null}
              <dl className='space-y-3'>
                {section.fields.map((field, fi) => (
                  <div key={fi} className='grid gap-0.5'>
                    <dt className='text-muted-foreground text-xs'>
                      {typeof field.label === 'function' ? field.label(data) : field.label}
                    </dt>
                    <dd className='text-sm break-words'>
                      {typeof field.value === 'function' ? field.value(data) : (field.value ?? '—')}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        {barActions.length > 0 || overflowActions.length > 0 ? (
          <SheetFooter
            className={cn(
              'sticky bottom-0 z-10 border-t border-border bg-background px-3 py-2.5 sm:px-4 sm:py-3',
              'pb-[max(0.75rem,env(safe-area-inset-bottom))]'
            )}
          >
            <div className='flex w-full items-center gap-1.5 sm:gap-2'>
              {barActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    type='button'
                    variant={action.variant ?? 'default'}
                    className={cn(
                      'h-10 flex-1 min-w-0 px-2 text-xs sm:text-sm font-medium',
                      action.className
                    )}
                    onClick={() => handleActionClick(action)}
                  >
                    {Icon ? <Icon className='me-1.5 size-4 shrink-0' /> : null}
                    <span className='truncate'>{action.label}</span>
                  </Button>
                );
              })}
              {overflowActions.length > 0 ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        className='h-10 w-10 shrink-0'
                        aria-label={t('common.actions')}
                      >
                        <Icons.ellipsis className='size-4' />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align='end' side='top' className='min-w-40'>
                    <DropdownMenuGroup>
                      {overflowActions.map((action) => {
                        const Icon = action.icon;
                        const isDestructive = action.variant === 'destructive';
                        return (
                          <DropdownMenuItem
                            key={action.label}
                            variant={isDestructive ? 'destructive' : 'default'}
                            onClick={() => handleActionClick(action)}
                            className='cursor-pointer py-2'
                          >
                            {Icon ? <Icon className='me-2 size-4 shrink-0' /> : null}
                            <span className='truncate'>{action.label}</span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
