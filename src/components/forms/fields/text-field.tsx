'use client';

import * as React from 'react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useFieldContext, useFieldInvalid } from '@/lib/form-context';
import { clampText, INPUT_LIMITS } from '@/lib/input-limits';
import type { TextFieldProps } from '@/types';
export type { TextFieldProps };

export function TextField({
  label,
  description,
  required,
  startIcon: StartIcon,
  className,
  type,
  min,
  max,
  maxLength,
  onKeyDown,
  ...inputProps
}: TextFieldProps) {
  const field = useFieldContext<string | number | undefined>();
  const t = useTranslations();
  const isInvalid = useFieldInvalid();
  const isValidating = field.state.meta.isValidating;
  const [showPassword, setShowPassword] = React.useState(false);

  const isPassword = type === 'password';
  const isNumber = type === 'number';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const useGroup = Boolean(StartIcon) || isPassword;
  const resolvedMin = min ?? (isNumber ? 0 : undefined);
  const resolvedMax = max ?? (isNumber ? INPUT_LIMITS.amountRupeesMax : undefined);
  const resolvedMaxLength =
    maxLength ??
    (isPassword ? INPUT_LIMITS.password : isNumber ? undefined : INPUT_LIMITS.name);

  const sharedInputProps = {
    ...inputProps,
    id: field.name,
    name: field.name,
    value: field.state.value ?? '',
    min: resolvedMin,
    max: resolvedMax,
    maxLength: isNumber ? undefined : resolvedMaxLength,
    onBlur: field.handleBlur,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isNumber) {
        if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
          e.preventDefault();
        }
      }
      onKeyDown?.(e);
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isNumber) {
        const next =
          resolvedMaxLength !== undefined
            ? clampText(e.target.value, resolvedMaxLength)
            : e.target.value;
        field.handleChange(next);
        return;
      }
      if (e.target.value === '') {
        field.handleChange(undefined);
        return;
      }
      const n = Number(e.target.value);
      if (Number.isNaN(n)) return;
      const minBound = resolvedMin !== undefined ? Number(resolvedMin) : 0;
      const maxBound =
        resolvedMax !== undefined ? Number(resolvedMax) : INPUT_LIMITS.amountRupeesMax;
      let next = n < minBound ? minBound : n;
      if (next > maxBound) next = maxBound;
      field.handleChange(next);
    },
    'aria-invalid': isInvalid,
    'aria-describedby': isInvalid ? `${field.name}-error` : undefined,
    type: inputType
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && ' *'}
      </FieldLabel>
      {useGroup ? (
        <InputGroup
          className={cn(
            'h-9! has-[[data-slot=input-group-control]:focus-visible]:ring-0',
            className
          )}
          data-disabled={inputProps.disabled ? true : undefined}
        >
          {StartIcon ? (
            <InputGroupAddon align='inline-start'>
              <StartIcon className='size-4' />
            </InputGroupAddon>
          ) : null}
          <InputGroupInput {...sharedInputProps} />
          {isPassword ? (
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                size='icon-xs'
                aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <Icons.eyeOff /> : <Icons.eye />}
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
          {isValidating ? (
            <InputGroupAddon align='inline-end'>
              <Spinner className='size-4' />
            </InputGroupAddon>
          ) : null}
        </InputGroup>
      ) : (
        <div className='relative'>
          <Input className={className} {...sharedInputProps} />
          {isValidating && <Spinner className='absolute top-1/2 inset-e-3 h-4 w-4 -translate-y-1/2' />}
        </div>
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </Field>
  );
}
