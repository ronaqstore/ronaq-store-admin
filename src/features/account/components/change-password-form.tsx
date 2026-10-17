'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { DialogPrimaryButton } from '@/components/common/dialog-actions';
import { useAppForm } from '@/lib/form';
import { useT } from '@/i18n/use-t';
import { changePassword } from '../api/service';
import { createChangePasswordSchema } from '../schemas/change-password-schema';

export function ChangePasswordForm() {
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
        form.reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('account.passwordChangeFailed'));
      } finally {
        setSaving(false);
      }
    }
  });

  return (
    <Card className='mx-auto w-full max-w-lg'>
      <CardHeader>
        <CardTitle>{t('account.changePasswordTitle')}</CardTitle>
        <CardDescription>{t('account.changePasswordDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className='space-y-4'
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
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

          <div className='flex justify-end'>
            <DialogPrimaryButton mode='save' loading={saving} disabled={saving} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
