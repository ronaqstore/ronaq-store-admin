'use client';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useFieldContext, useFieldInvalid } from '@/lib/form-context';
import { clampText, INPUT_LIMITS } from '@/lib/input-limits';
import type { TextareaFieldProps } from '@/types';

export function TextareaField({
  label,
  description,
  required,
  showCount,
  maxLength,
  ...textareaProps
}: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = useFieldInvalid();
  const resolvedMaxLength = maxLength ?? INPUT_LIMITS.notes;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && ' *'}
      </FieldLabel>
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        maxLength={resolvedMaxLength}
        onChange={(e) => field.handleChange(clampText(e.target.value, resolvedMaxLength))}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? `${field.name}-error` : undefined}
        {...textareaProps}
      />
      {showCount ? (
        <div className='text-muted-foreground text-end text-sm'>
          {field.state.value?.length || 0} / {resolvedMaxLength}
        </div>
      ) : null}
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </Field>
  );
}
