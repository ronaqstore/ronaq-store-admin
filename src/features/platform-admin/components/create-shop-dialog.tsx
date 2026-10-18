'use client';

import { useState, type FormEvent } from 'react';
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
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { useAppForm } from '@/lib/form';
import { INPUT_LIMITS } from '@/lib/input-limits';
import { useT } from '@/i18n/use-t';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { platformKeys } from '../api/queries';
import { createPlatformShop } from '../api/service';
import { createShopFormSchema } from '../schemas/create-shop-schema';
import type { CreateShopDialogBodyProps, CreateShopDialogProps } from '@/types';

function defaultSubscriptionEndsAt(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 30);
  return d;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function CreateShopDialog({ open, onOpenChange }: CreateShopDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <CreateShopDialogBody onOpenChange={onOpenChange} /> : null}
    </Dialog>
  );
}

function CreateShopDialogBody({ onOpenChange }: CreateShopDialogBodyProps) {
  const t = useT();
  const qc = useQueryClient();
  const [setupUrl, setSetupUrl] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: createPlatformShop,
    onSuccess: async (res) => {
      toast.success(t('platform.createShopSuccess', { name: res.shopName }));
      setSetupUrl(res.setupUrl);
      await qc.invalidateQueries({ queryKey: platformKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || t('platform.createShopFailed'));
    }
  });

  const form = useAppForm({
    defaultValues: {
      shopName: '',
      shopPhone: '',
      shopAddress: '',
      ownerName: '',
      ownerPhone: '',
      subscriptionEndsAt: defaultSubscriptionEndsAt()
    },
    validators: {
      onSubmit: createShopFormSchema(t)
    },
    onSubmit: async ({ value }) => {
      await create.mutateAsync({
        shopName: value.shopName.trim(),
        shopPhone: value.shopPhone.trim() || undefined,
        shopAddress: value.shopAddress.trim() || undefined,
        ownerName: value.ownerName.trim(),
        ownerPhone: value.ownerPhone.trim(),
        subscriptionEndsAt: toIsoDate(value.subscriptionEndsAt)
      });
    }
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  const copySetupUrl = async () => {
    if (!setupUrl) return;
    try {
      await navigator.clipboard.writeText(setupUrl);
      toast.success(t('platform.setupLinkCopied'));
    } catch {
      toast.error(t('platform.setupLinkCopyFailed'));
    }
  };

  return (
    <DialogContent className='max-h-[92vh] overflow-y-auto w-full sm:max-w-lg'>
      <DialogHeader>
        <DialogTitle>{t('platform.createShopTitle')}</DialogTitle>
        <DialogDescription>{t('platform.createShopDescription')}</DialogDescription>
      </DialogHeader>

      {setupUrl ? (
        <div className='space-y-3 pt-2'>
          <p className='text-muted-foreground text-sm'>{t('platform.setupLinkOnce')}</p>
          <code className='bg-muted block break-all rounded-md p-3 text-xs'>{setupUrl}</code>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              {t('common.close')}
            </Button>
            <Button type='button' onClick={() => void copySetupUrl()}>
              {t('platform.copySetupLink')}
            </Button>
          </DialogFooter>
        </div>
      ) : (
        <form className='space-y-4 pt-2' onSubmit={handleSubmit}>
          <FieldGroup>
            <form.AppField name='shopName'>
              {(field) => (
                <field.TextField
                  label={t('platform.fields.shopName')}
                  maxLength={INPUT_LIMITS.nameLong}
                  placeholder={t('platform.fields.shopNamePlaceholder')}
                  required
                />
              )}
            </form.AppField>
            <form.AppField name='shopPhone'>
              {(field) => (
                <field.TextField
                  label={t('platform.fields.shopPhone')}
                  maxLength={INPUT_LIMITS.phone}
                  placeholder={t('platform.fields.phonePlaceholder')}
                />
              )}
            </form.AppField>
            <form.AppField name='shopAddress'>
              {(field) => (
                <field.TextareaField
                  label={t('platform.fields.shopAddress')}
                  maxLength={INPUT_LIMITS.shopAddress}
                  placeholder={t('platform.fields.shopAddressPlaceholder')}
                />
              )}
            </form.AppField>
            <form.AppField name='ownerName'>
              {(field) => (
                <field.TextField
                  label={t('platform.fields.ownerName')}
                  maxLength={INPUT_LIMITS.name}
                  placeholder={t('platform.fields.ownerNamePlaceholder')}
                  required
                />
              )}
            </form.AppField>
            <form.AppField name='ownerPhone'>
              {(field) => (
                <field.TextField
                  label={t('platform.fields.ownerPhone')}
                  maxLength={INPUT_LIMITS.phone}
                  placeholder={t('platform.fields.phonePlaceholder')}
                  required
                />
              )}
            </form.AppField>
            <form.AppField name='subscriptionEndsAt'>
              {(field) => (
                <field.DatePickerField
                  label={t('platform.fields.subscriptionEndsAt')}
                  required
                  disabledDates={(date) => date.getTime() < Date.now() - 86_400_000}
                />
              )}
            </form.AppField>
          </FieldGroup>

          <DialogFooter>
            <DialogCancelButton onClick={() => onOpenChange(false)} disabled={create.isPending} />
            <DialogPrimaryButton mode='add' loading={create.isPending} disabled={create.isPending} />
          </DialogFooter>
        </form>
      )}
    </DialogContent>
  );
}
