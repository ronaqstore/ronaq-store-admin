'use client';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useFieldContext, useFieldInvalid } from '@/lib/form-context';
import type { RadioGroupFieldProps } from '@/types';

export function RadioGroupField({
  label,
  description,
  required,
  options,
  className
}: RadioGroupFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = useFieldInvalid();

  return (
    <FieldSet>
      <FieldLegend variant='label'>
        {label}
        {required && ' *'}
      </FieldLegend>
      {description && <FieldDescription>{description}</FieldDescription>}
      <RadioGroup
        name={field.name}
        value={field.state.value}
        onValueChange={field.handleChange}
        onBlur={field.handleBlur}
        className={cn('flex flex-wrap gap-x-6 gap-y-2', className)}
      >
        {options.map((opt) => (
          <Field
            key={opt.value}
            orientation='horizontal'
            data-invalid={isInvalid}
            className={className ? 'w-full min-w-0 sm:w-auto' : 'w-auto'}
          >
            <RadioGroupItem
              value={opt.value}
              id={`${field.name}-${opt.value}`}
              disabled={opt.disabled}
              aria-invalid={isInvalid}
              aria-describedby={isInvalid ? `${field.name}-error` : undefined}
            />
            <FieldLabel
              htmlFor={`${field.name}-${opt.value}`}
              className={cn('font-normal', className && 'min-w-0 flex-1')}
            >
              {opt.label}
            </FieldLabel>
          </Field>
        ))}
      </RadioGroup>
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </FieldSet>
  );
}
