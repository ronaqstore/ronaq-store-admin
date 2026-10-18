'use client';

import { FieldError } from '@/components/ui/field';
import type { DialogFieldErrorProps } from '@/types/forms';

export function DialogFieldError({ id, message }: DialogFieldErrorProps) {
  if (!message) return null;
  return (
    <FieldError id={id} role='alert'>
      {message}
    </FieldError>
  );
}
