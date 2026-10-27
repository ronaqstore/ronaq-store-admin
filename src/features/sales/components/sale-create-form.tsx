'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { FormEntitySelect } from '@/components/forms/form-entity-select';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { useT } from '@/i18n/use-t';
import { useAppForm } from '@/lib/form';
import { INPUT_LIMITS } from '@/lib/input-limits';
import { isFieldMetaInvalid } from '@/lib/form-context';
import { createClientRequestId } from '@/lib/dukaan/numbers';
import { isValidationApiError } from '@/lib/api/is-validation-error';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { listCustomers } from '@/features/customers/api/service';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { createSaleMutation } from '../api/mutations';
import { createSaleFormSchema } from '../schemas/sale-schema';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { SALE_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import {
  buildCreateSalePayload,
  calcSaleTotals,
  emptySaleLine,
  isPhoneSaleLine,
  selectSaleTotals
} from '../helpers/sale-create-helpers';
import { SaleLineCard } from './sale-line-card';
import { SaleTotalsSummary } from './sale-totals-summary';
import { OverdraftAlert } from '@/components/common/overdraft-alert';
import type { SaleDTO } from '@/lib/api/types';
import type {
  SaleFormSubmitContext,
  SaleFormValues,
  SaleCreateFormProps,
  CreateSaleResult,
  SaleBelowCostPrompt
} from '@/types/sales';
import { EMPTY_FORM_NUMBER } from '@/types/common';

export function SaleCreateForm({ onDone }: SaleCreateFormProps) {
  const qc = useQueryClient();
  const t = useT();
  const [clientRequestId] = useState(() => createClientRequestId());
  const [formApiError, setFormApiError] = useState<string | null>(null);
  const [belowCostPrompt, setBelowCostPrompt] = useState<SaleBelowCostPrompt | null>(null);
  const [confirmBelowCost, setConfirmBelowCost] = useState(false);

  const save = useMutation({
    ...createSaleMutation,
    onSuccess: (res: CreateSaleResult) => {
      if (res && 'confirmBelowCost' in res && res.confirmBelowCost) {
        setBelowCostPrompt(res);
        return;
      }
      setBelowCostPrompt(null);
      setConfirmBelowCost(false);
      invalidateDomains({ queryClient: qc, domains: SALE_SYNC_DOMAINS });
      onDone?.();
      toastSuccessAfterClose(
        (res as SaleDTO)?.saleNo
          ? t('dukaan.sale.saved', { saleNo: (res as SaleDTO).saleNo })
          : (res as { message?: string })?.message || t('dukaan.sale.saved', { saleNo: '' })
      );
    },
    onError: (e: Error) => {
      if (isValidationApiError(e)) {
        setFormApiError(e.message);
        return;
      }
      toast.error(e.message);
    }
  });

  const defaultValues: SaleFormValues = {
    customer_id: '__walkin__',
    discount: EMPTY_FORM_NUMBER,
    paid_now: EMPTY_FORM_NUMBER,
    notes: '',
    lines: [{ ...emptySaleLine }]
  };

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: createSaleFormSchema(t) as never },
    onSubmit: ({ value }: SaleFormSubmitContext) => {
      setFormApiError(null);
      if (belowCostPrompt && !confirmBelowCost) {
        setFormApiError(
          t('sales.confirmBelowCostRequired') ||
            'Please check the confirmation box to confirm selling below cost.'
        );
        return;
      }
      save.mutate(
        buildCreateSalePayload(
          value.lines,
          value.customer_id,
          Number(value.discount) || 0,
          Number(value.paid_now) || 0,
          value.notes,
          clientRequestId,
          confirmBelowCost
        )
      );
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  return (
    <form className='space-y-4' onSubmit={handleSubmit}>
      {formApiError ? (
        <Alert variant='destructive'>
          <Icons.warning />
          <AlertDescription>{formApiError}</AlertDescription>
        </Alert>
      ) : null}
      {belowCostPrompt ? (
        <OverdraftAlert
          checked={confirmBelowCost}
          onCheckedChange={setConfirmBelowCost}
          title={belowCostPrompt.message}
          confirmLabel={t('sales.confirmBelowCost') || 'I confirm selling below cost'}
          id='confirm-below-cost'
          variant='banner'
        />
      ) : null}
      <form.Subscribe
        selector={(s) => s.values.lines.some((l) => isPhoneSaleLine(l))}
        children={(hasPhone) =>
          hasPhone ? (
            <Alert>
              <Icons.warning />
              <AlertTitle>{t('dukaan.sale.noWarrantyAlertTitle')}</AlertTitle>
              <AlertDescription>{t('dukaan.sale.noWarrantyAlert')}</AlertDescription>
            </Alert>
          ) : null
        }
      />

      <FieldGroup className='max-w-md gap-3'>
        <form.Subscribe
          selector={(s) => s.values.lines}
          children={(lines) => {
            const hasPhone = lines.some((l) => isPhoneSaleLine(l));
            return (
              <form.Field
                name='customer_id'
                children={(field) => {
                  const isInvalid = isFieldMetaInvalid(field.state.meta);
                  return (
                    <FormEntitySelect
                      name={field.name}
                      label={
                        hasPhone
                          ? t('dukaan.sale.customerRequiredPhones')
                          : t('dukaan.sale.customerRequiredUdhar')
                      }
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onValueChange={(id) => field.handleChange(id || '__walkin__')}
                      isInvalid={isInvalid}
                      errors={field.state.meta.errors}
                      queryKey={['customers', 'picker']}
                      fetchPage={(filters) =>
                        listCustomers(filters).then((res) => ({
                          items: res.items,
                          total: res.total,
                          page: res.page,
                          limit: res.pageSize
                        }))
                      }
                      placeholder={t('dukaan.sale.walkInOrCustomer')}
                      searchPlaceholder={t('dukaan.sale.searchCustomers')}
                      selectedLabel={
                        field.state.value === '__walkin__' ? t('dukaan.sale.walkIn') : undefined
                      }
                      extraItems={[
                        {
                          id: '__walkin__',
                          name: t('dukaan.sale.walkInCashOnly')
                        }
                      ]}
                    />
                  );
                }}
              />
            );
          }}
        />
      </FieldGroup>

      <div className='space-y-3'>
        <form.AppField
          name='lines'
          mode='array'
          children={(field) => (
            <>
              {field.state.value.map((_line, idx) => {
                const excludedUnitIds = field.state.value
                  .map((other, otherIdx) =>
                    otherIdx !== idx ? other.inventory_unit_id : undefined
                  )
                  .filter((id): id is string => !!id);
                return (
                  <SaleLineCard
                    key={idx}
                    form={form as never}
                    index={idx}
                    canRemove={field.state.value.length > 1}
                    onRemove={() => field.removeValue(idx)}
                    excludedUnitIds={excludedUnitIds}
                  />
                );
              })}
              <div className='flex justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => field.pushValue({ ...emptySaleLine })}
                >
                  <Icons.add className='me-2 h-4 w-4' />
                  {t('dukaan.sale.addItem')}
                </Button>
              </div>
            </>
          )}
        />
      </div>

      <div className='grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2'>
        <form.AppField
          name='discount'
          children={(field) => (
            <field.TextField
              label={t('dukaan.sale.discount')}
              type='number'
              min={0}
              max={INPUT_LIMITS.amountRupeesMax}
              placeholder={t('dukaan.sale.discountPlaceholder')}
            />
          )}
        />
        <form.AppField
          name='paid_now'
          children={(field) => (
            <field.TextField
              label={t('dukaan.sale.paidNow')}
              type='number'
              min={0}
              max={INPUT_LIMITS.amountRupeesMax}
              required
              placeholder={t('dukaan.sale.paidNowPlaceholder')}
            />
          )}
        />
        <div className='sm:col-span-2'>
          <form.AppField
            name='notes'
            children={(field) => (
              <field.TextField
                label={t('dukaan.sale.notes')}
                maxLength={INPUT_LIMITS.notes}
                placeholder={t('dukaan.sale.notesPlaceholder')}
              />
            )}
          />
        </div>
        <form.Subscribe
          selector={selectSaleTotals}
          children={({ lines, discount, paidNow }) => (
            <SaleTotalsSummary {...calcSaleTotals(lines, discount, paidNow)} />
          )}
        />
      </div>

      <DialogFooter className='mx-0 mb-0 px-0 gap-2 sm:gap-2.5'>
        {onDone ? <DialogCancelButton onClick={onDone} disabled={save.isPending} /> : null}
        <DialogPrimaryButton mode='add' loading={save.isPending} />
      </DialogFooter>
    </form>
  );
}
