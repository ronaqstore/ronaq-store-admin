'use client';

import { type FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { useAppForm } from '@/lib/form';
import { useT } from '@/i18n/use-t';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { updateShopSubscription } from '../api/service';
import type { RenewSubscriptionDialogProps } from '@/types';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { PLATFORM_SYNC_DOMAINS } from '@/lib/query/sync-domains';

function parseEndsAt(iso: string): Date {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setUTCDate(fallback.getUTCDate() + 30);
    return fallback;
  }
  return d;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function RenewSubscriptionDialog({
  open,
  onOpenChange,
  shopId,
  shopName,
  currentEndsAt
}: RenewSubscriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <RenewSubscriptionDialogBody
          shopId={shopId}
          shopName={shopName}
          currentEndsAt={currentEndsAt}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function RenewSubscriptionDialogBody({
  shopId,
  shopName,
  currentEndsAt,
  onOpenChange
}: Omit<RenewSubscriptionDialogProps, 'open'>) {
  const t = useT();
  const qc = useQueryClient();
  const [subscriptionDateError, setSubscriptionDateError] = useState('');

  const renew = useMutation({
    mutationFn: (subscriptionEndsAt: string) =>
      updateShopSubscription(shopId, { subscriptionEndsAt }),
    onSuccess: async (res) => {
      onOpenChange(false);
      invalidateDomains({ queryClient: qc, domains: PLATFORM_SYNC_DOMAINS });
      toastSuccessAfterClose(t('platform.renewSuccess', { name: res.shopName }));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('platform.renewFailed'));
    }
  });

  const form = useAppForm({
    defaultValues: {
      subscriptionEndsAt: parseEndsAt(currentEndsAt)
    },
    onSubmit: async ({ value }) => {
      if (!(value.subscriptionEndsAt instanceof Date)) {
        setSubscriptionDateError(t('platform.validation.subscriptionRequired'));
        return;
      }
      setSubscriptionDateError('');
      await renew.mutateAsync(toIsoDate(value.subscriptionEndsAt));
    }
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  return (
    <DialogContent className='w-full sm:max-w-md'>
      <DialogHeader>
        <DialogTitle>{t('platform.renewTitle')}</DialogTitle>
        <DialogDescription>
          {t('platform.renewDescription', { name: shopName })}
        </DialogDescription>
      </DialogHeader>

      <form className='space-y-4 pt-2' onSubmit={handleSubmit}>
        <FieldGroup>
          <form.AppField
            name='subscriptionEndsAt'
            listeners={{ onChange: () => setSubscriptionDateError('') }}
          >
            {(field) => (
              <field.DatePickerField
                label={t('platform.fields.subscriptionEndsAt')}
                required
                disabledDates={(date) => date.getTime() < Date.now() - 86_400_000}
              />
            )}
          </form.AppField>
          <DialogFieldError message={subscriptionDateError} />
        </FieldGroup>

        <DialogFooter>
          <DialogCancelButton onClick={() => onOpenChange(false)} disabled={renew.isPending} />
          <DialogPrimaryButton mode='save' loading={renew.isPending} disabled={renew.isPending} />
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
