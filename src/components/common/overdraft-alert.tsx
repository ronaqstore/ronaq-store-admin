'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { OverdraftAlertProps } from '@/types';

export function OverdraftAlert({
  checked,
  onCheckedChange,
  title,
  description,
  confirmLabel,
  variant = 'compact',
  id = 'confirm-overdraft',
  className
}: OverdraftAlertProps) {
  const handleToggle = () => {
    onCheckedChange(!checked);
  };

  const handleCheckboxChange = (value: boolean | 'indeterminate') => {
    onCheckedChange(Boolean(value));
  };

  if (variant === 'banner') {
    return (
      <Alert className={cn('text-xs', className)}>
        <Icons.warning />
        {title ? <AlertTitle>{title}</AlertTitle> : null}
        {description ? <AlertDescription>{description}</AlertDescription> : null}
        {confirmLabel ? (
          <label className='col-start-2 mt-2 flex cursor-pointer items-center gap-2 font-medium text-foreground'>
            <Checkbox checked={checked} onCheckedChange={handleCheckboxChange} />
            <span>{confirmLabel}</span>
          </label>
        ) : null}
      </Alert>
    );
  }

  return (
    <div
      onClick={handleToggle}
      className={cn(
        'flex cursor-pointer items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive select-none transition-colors hover:bg-destructive/15',
        className
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={handleCheckboxChange}
        onClick={(e) => e.stopPropagation()}
        className='mt-0.5 size-4.5 shrink-0 rounded border-2 border-destructive/70 bg-background shadow-xs data-checked:border-destructive data-checked:bg-destructive data-checked:text-destructive-foreground'
      />
      <Label
        htmlFor={id}
        onClick={(e) => e.stopPropagation()}
        className='cursor-pointer text-xs leading-normal font-normal text-foreground'
      >
        {title ? <span className='mb-0.5 block font-medium text-destructive'>{title}</span> : null}
        {description}
      </Label>
    </div>
  );
}
