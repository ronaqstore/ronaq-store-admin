'use client';

import { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import { useAppForm } from '@/lib/form';
import { INPUT_LIMITS } from '@/lib/input-limits';
import { formatPkCnic, sanitizePkCnicInput, sanitizePkMobileInput } from '@/lib/validation/pk';
import { fromPaisa } from '@/lib/dukaan/numbers';
import { buildPartyPayload } from '@/lib/party/party-payload';
import { isValidationApiError } from '@/lib/api/is-validation-error';
import { mapPartyApiError } from '@/lib/api/map-party-api-error';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import type { BasePartyDialogProps, BasePartyDialogBodyProps, BasePartyFormState } from '@/types';
import { EMPTY_FORM_NUMBER } from '@/types/common';

export function BasePartyDialog({
  open,
  onOpenChange,
  party,
  titleAdd,
  titleEdit,
  descriptionAdd,
  descriptionEdit,
  openingBalanceLabel,
  namePlaceholder,
  successCreated,
  successUpdated,
  primaryButtonMode,
  showCnic,
  onSave,
  invalidateQueryKey,
  schema
}: BasePartyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <BasePartyDialogBody
          key={party?.id ?? 'new'}
          open={open}
          party={party}
          onOpenChange={onOpenChange}
          titleAdd={titleAdd}
          titleEdit={titleEdit}
          descriptionAdd={descriptionAdd}
          descriptionEdit={descriptionEdit}
          openingBalanceLabel={openingBalanceLabel}
          namePlaceholder={namePlaceholder}
          successCreated={successCreated}
          successUpdated={successUpdated}
          primaryButtonMode={primaryButtonMode}
          showCnic={showCnic}
          onSave={onSave}
          invalidateQueryKey={invalidateQueryKey}
          schema={schema}
        />
      ) : null}
    </Dialog>
  );
}

function BasePartyDialogBody({
  party,
  onOpenChange,
  titleAdd,
  titleEdit,
  descriptionAdd,
  descriptionEdit,
  openingBalanceLabel,
  namePlaceholder,
  successCreated,
  successUpdated,
  primaryButtonMode,
  showCnic,
  onSave,
  invalidateQueryKey,
  schema
}: BasePartyDialogBodyProps) {
  const qc = useQueryClient();
  const t = useT();
  const isEdit = Boolean(party);
  const resolvedPrimaryMode = primaryButtonMode ?? (isEdit ? 'edit' : 'add');
  const [formApiError, setFormApiError] = useState<string | null>(null);

  const openingLocked =
    isEdit &&
    party?.currentBalance !== undefined &&
    party.currentBalance !== party.openingBalance;

  const save = useMutation({
    mutationFn: async (value: BasePartyFormState) => {
      const payload = buildPartyPayload(
        value,
        isEdit ? 'edit' : 'create',
        showCnic,
        party?.openingBalance
      );
      if (openingLocked && 'openingBalance' in payload) {
        delete payload.openingBalance;
      }
      return onSave(payload, party?.id);
    },
    onSuccess: () => {
      onOpenChange(false);
      void qc.invalidateQueries({ queryKey: invalidateQueryKey });
      toastSuccessAfterClose(isEdit ? successUpdated : successCreated);
    }
  });

  const defaultValues: BasePartyFormState = {
    name: party?.name ?? '',
    phone: party?.phone ?? '',
    cnic: formatPkCnic(party?.cnic) || '',
    address: party?.address ?? '',
    notes: party?.notes ?? '',
    opening_balance: party ? fromPaisa(party.openingBalance) : EMPTY_FORM_NUMBER
  };

  const form = useAppForm({
    defaultValues,
    validators: schema ? { onSubmit: schema as never } : undefined,
    onSubmit: async ({ value }) => {
      setFormApiError(null);
      try {
        await save.mutateAsync(value);
      } catch (e) {
        if (isValidationApiError(e)) {
          const mapped = mapPartyApiError(e, t);
          if (mapped.field) {
            form.setFieldMeta(mapped.field, (meta) => ({
              ...meta,
              errorMap: { ...meta.errorMap, onSubmit: mapped.message },
              errors: [mapped.message]
            }));
            return;
          }
          setFormApiError(mapped.message);
          return;
        }
        toast.error(e instanceof Error ? e.message : String(e));
      }
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  return (
    <DialogContent className='flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg'>
      <DialogHeader className='shrink-0 px-4 pt-4 pe-12'>
        <DialogTitle>{isEdit ? titleEdit : titleAdd}</DialogTitle>
        <DialogDescription>{isEdit ? descriptionEdit : descriptionAdd}</DialogDescription>
      </DialogHeader>
      <form className='flex min-h-0 flex-1 flex-col' onSubmit={handleSubmit}>
        <div className='no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4'>
          {formApiError ? (
            <Alert variant='destructive' className='mb-4'>
              <Icons.warning />
              <AlertDescription>{formApiError}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup className='gap-4'>
            <form.AppField
              name='name'
              children={(field) => (
                <field.TextField
                  label={t('dukaan.party.name')}
                  required
                  disabled={party?.isSystem}
                  autoFocus={!party?.isSystem}
                  placeholder={namePlaceholder}
                />
              )}
            />
            <form.AppField
              name='phone'
              children={(field) => (
                <field.TextField
                  label={t('dukaan.party.phone')}
                  type='tel'
                  inputMode='numeric'
                  maxLength={INPUT_LIMITS.phonePk}
                  sanitize={sanitizePkMobileInput}
                  placeholder={t('users.phonePlaceholder')}
                  startIcon={Icons.phone}
                  description={t('dukaan.party.phoneHelp')}
                />
              )}
            />
            {showCnic ? (
              <form.AppField
                name='cnic'
                children={(field) => (
                  <field.TextField
                    label={t('dukaan.party.cnic')}
                    inputMode='numeric'
                    maxLength={INPUT_LIMITS.cnic}
                    sanitize={sanitizePkCnicInput}
                    placeholder={t('dukaan.party.cnicPlaceholder')}
                    description={t('dukaan.party.cnicHelp')}
                  />
                )}
              />
            ) : null}
            <form.AppField
              name='address'
              children={(field) => (
                <field.TextField
                  label={t('dukaan.party.address')}
                  maxLength={INPUT_LIMITS.addressCustomer}
                  placeholder={t('dukaan.party.addressPlaceholder')}
                />
              )}
            />
            <form.AppField
              name='opening_balance'
              children={(field) => (
                <field.TextField
                  label={openingBalanceLabel}
                  type='number'
                  min={0}
                  max={INPUT_LIMITS.amountRupeesMax}
                  disabled={openingLocked}
                  placeholder={t('dukaan.party.openingBalancePlaceholder')}
                  description={
                    openingLocked ? t('dukaan.party.openingBalanceLockedHelp') : undefined
                  }
                />
              )}
            />
            <form.AppField
              name='notes'
              children={(field) => (
                <field.TextareaField
                  label={t('dukaan.party.notes')}
                  placeholder={t('dukaan.party.notesPlaceholder')}
                />
              )}
            />
          </FieldGroup>
        </div>
        <DialogFooter className='mx-0 mb-0 shrink-0 gap-2 sm:gap-2.5'>
          <DialogCancelButton onClick={() => onOpenChange(false)} disabled={save.isPending} />
          <DialogPrimaryButton mode={resolvedPrimaryMode} loading={save.isPending} />
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
