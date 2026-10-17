'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { useAppForm } from '@/lib/form';
import { useT } from '@/i18n/use-t';
import type { ChangePasswordDialogBodyProps, ChangePasswordDialogProps } from '@/types';
import { changePassword } from '../api/service';
import { createChangePasswordSchema } from '../schemas/change-password-schema';

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <ChangePasswordDialogBody onOpenChange={onOpenChange} /> : null}
    </Dialog>
  );
}

function ChangePasswordDialogBody({ onOpenChange }: ChangePasswordDialogBodyProps) {
  const t = useT();
  const [saving, setSaving] = useState(false);

  const form = useAppForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validators: {
      onSubmit: createChangePasswordSchema(t)
    },
    onSubmit: async ({ value }) => {
      setSaving(true);
      try {
        await changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword
        });
        toast.success(t('account.passwordChanged'));
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('account.passwordChangeFailed'));
      } finally {
        setSaving(false);
      }
    }
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  return (
    <DialogContent className='w-full sm:max-w-md'>
      <DialogHeader>
        <DialogTitle>{t('account.changePasswordTitle')}</DialogTitle>
        <DialogDescription>{t('account.changePasswordDescription')}</DialogDescription>
      </DialogHeader>

      <form className='space-y-4 pt-2' onSubmit={handleSubmit}>
        <FieldGroup>
          <form.AppField name='currentPassword'>
            {(field) => (
              <field.TextField
                label={t('account.currentPassword')}
                type='password'
                autoComplete='current-password'
                required
              />
            )}
          </form.AppField>
          <form.AppField name='newPassword'>
            {(field) => (
              <field.TextField
                label={t('account.newPassword')}
                type='password'
                autoComplete='new-password'
                required
                description={t('account.newPasswordHint')}
              />
            )}
          </form.AppField>
          <form.AppField name='confirmPassword'>
            {(field) => (
              <field.TextField
                label={t('account.confirmPassword')}
                type='password'
                autoComplete='new-password'
                required
              />
            )}
          </form.AppField>
        </FieldGroup>

        <DialogFooter>
          <DialogCancelButton onClick={() => onOpenChange(false)} disabled={saving} />
          <DialogPrimaryButton mode='save' loading={saving} disabled={saving} />
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
