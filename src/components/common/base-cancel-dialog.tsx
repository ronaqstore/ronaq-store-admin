'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { PresetReasonPills } from '@/components/common/preset-reason-pills';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { useT } from '@/i18n/use-t';
import { INPUT_LIMITS, clampText } from '@/lib/input-limits';
import { cn } from '@/lib/utils';
import type { BaseCancelDialogProps } from '@/types';

export function BaseCancelDialog({
  open,
  onOpenChange,
  title,
  description,
  isBlocked,
  blockedTitle,
  blockedReason,
  closeLabel,
  isLoadingImpact,
  impactItems = [],
  overdraftAlert,
  presetReasons,
  reason,
  onReasonChange,
  reasonLabel,
  reasonPlaceholder,
  reasonId = 'cancel-reason',
  reasonCharactersCountText,
  quickSelectReasonText,
  reasonError,
  onSubmit,
  isSubmitting,
  cancelButtonText,
  submitButtonText
}: BaseCancelDialogProps) {
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isBlocked ? (
          <div className='space-y-4 pt-2'>
            <div className='flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive dark:bg-destructive/15'>
              <Icons.close className='size-4 shrink-0 mt-0.5' />
              <div>
                <p className='font-semibold'>{blockedTitle || t('common.close')}</p>
                <p className='mt-0.5 text-muted-foreground'>{blockedReason || ''}</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                className='w-full sm:w-auto'
              >
                {closeLabel || t('common.close')}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} className='space-y-4 pt-2'>
            {(isLoadingImpact || impactItems.length > 0) && (
              <div className='rounded-xl border border-border/70 bg-muted/30 p-3 text-xs space-y-2'>
                {impactItems.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      'flex items-center justify-between text-muted-foreground',
                      item.divider && 'border-t border-border/50 pt-1.5'
                    )}
                  >
                    <span>{item.label}</span>
                    <span
                      className={cn(
                        'font-medium text-foreground',
                        item.highlight && 'font-semibold',
                        item.success && 'text-emerald-600 dark:text-emerald-400',
                        item.destructive && 'text-destructive'
                      )}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
                {isLoadingImpact ? (
                  <div className='space-y-2 py-1' aria-busy='true'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-[88%]' />
                    <Skeleton className='h-4 w-[72%]' />
                  </div>
                ) : null}
              </div>
            )}

            {overdraftAlert}

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor={reasonId} className='text-sm font-normal text-foreground'>
                  {reasonLabel || ''}
                </Label>
                {reasonCharactersCountText ? (
                  <span className='text-[11px] text-muted-foreground'>
                    {reasonCharactersCountText}
                  </span>
                ) : null}
              </div>
              <Textarea
                id={reasonId}
                value={reason}
                onChange={(e) =>
                  onReasonChange(clampText(e.target.value, INPUT_LIMITS.cancelReason))
                }
                placeholder={reasonPlaceholder || ''}
                rows={3}
                className={cn(
                  'resize-none text-xs',
                  reasonError && 'border-destructive'
                )}
                maxLength={INPUT_LIMITS.cancelReason}
                aria-invalid={!!reasonError}
                required
              />
              <DialogFieldError id={`${reasonId}-error`} message={reasonError} />
              {presetReasons && presetReasons.length > 0 && (
                <div className='space-y-1.5 pt-1'>
                  {quickSelectReasonText ? (
                    <p className='text-[11px] text-muted-foreground'>{quickSelectReasonText}</p>
                  ) : null}
                  <PresetReasonPills
                    reasons={presetReasons}
                    onSelect={(preset) => onReasonChange(preset)}
                  />
                </div>
              )}
            </div>

            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className='w-full sm:w-auto'
              >
                {cancelButtonText || t('common.cancel')}
              </Button>
              <Button
                type='submit'
                variant='destructive'
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className='w-full sm:w-auto'
              >
                {submitButtonText || t('common.confirm')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
