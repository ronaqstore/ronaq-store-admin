'use client';

import { createFormHookContexts } from '@tanstack/react-form';
import type { FieldMetaInvalidInput } from '@/types/forms';

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export function isFieldMetaInvalid(meta: FieldMetaInvalidInput): boolean {
  const hasSubmitError = Boolean(meta.errorMap?.onSubmit);
  return meta.errors.length > 0 && (meta.isTouched || hasSubmitError);
}

export function joinFieldErrors(errors: unknown[]): string | undefined {
  const message = errors
    .map((err) => (typeof err === 'string' ? err : String(err)))
    .filter(Boolean)
    .join(' ');
  return message || undefined;
}

export function useFieldInvalid() {
  const field = useFieldContext();
  return isFieldMetaInvalid(field.state.meta);
}

export type { BaseFieldProps } from '@/types/forms';
