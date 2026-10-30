'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { useT } from '@/i18n/use-t';
import { useAppForm } from '@/lib/form';
import { INPUT_LIMITS } from '@/lib/input-limits';
import { formatPkCnic } from '@/lib/validation/pk';
import { isFieldMetaInvalid, joinFieldErrors } from '@/lib/form-context';
import { createClientRequestId, formatPkr } from '@/lib/dukaan/numbers';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import type { CreatePurchaseResult } from '@/lib/api/types';
import type { OpeningStockChangeArgs, PurchaseFormValues } from '@/types/purchases';
import type { OverdraftPrompt, PickerFetchFilters, SupplierPickerItem } from '@/types';
import { EMPTY_FORM_NUMBER } from '@/types/common';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { FormEntitySelect } from '@/components/forms/form-entity-select';
import { listSuppliers } from '@/features/suppliers/api/service';
import { mapSupplierToPicker, toPickerPage } from '@/lib/api/picker';
import { createPurchaseMutation } from '../api/mutations';
import { createPurchaseFormSchema } from '../schemas/purchase-schema';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { PURCHASE_SYNC_DOMAINS } from '@/lib/query/sync-domains';
import {
  buildCreatePurchasePayload,
  emptyPurchaseLine,
  selectPurchaseSummary
} from '../helpers/purchase-create-helpers';
import { PurchaseLineCard } from './purchase-line-card';
import { PurchaseSummaryCard } from './purchase-summary-card';

export function PurchaseCreatePageClient() {
  const qc = useQueryClient();
  const router = useRouter();
  const t = useT();
  const [clientRequestId, setClientRequestId] = useState(() => createClientRequestId());
  const [warning, setWarning] = useState<OverdraftPrompt | null>(null);
  const [supplierCnic, setSupplierCnic] = useState<string | null>(null);

  const save = useMutation({
    ...createPurchaseMutation,
    onSuccess: (res: CreatePurchaseResult) => {
      if (res && 'confirmOverdraft' in res && res.confirmOverdraft) {
        setWarning({
          shortfall: res.shortfall,
          message: res.message
        });
        toast.warning(
          t('purchases.overdraftPrompt', {
            shortfall: formatPkr(res.shortfall ?? 0)
          })
        );
        return;
      }
      setClientRequestId(createClientRequestId());
      setWarning(null);
      invalidateDomains({ queryClient: qc, domains: PURCHASE_SYNC_DOMAINS });
      router.push('/dashboard/purchases');
      toastSuccessAfterClose(
        res?.message || t('dukaan.purchase.saved', { purchaseNo: res?.purchase?.purchaseNo ?? '' })
      );
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const submitPurchase = (values: PurchaseFormValues, confirmOverdraft = false) => {
    save.mutate(buildCreatePurchasePayload(values, clientRequestId, confirmOverdraft));
  };

  const defaultValues: PurchaseFormValues = {
    supplier_id: '',
    supplier_invoice_ref: '',
    is_opening_stock: false,
    paid_now: EMPTY_FORM_NUMBER,
    lines: [emptyPurchaseLine()]
  };

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: createPurchaseFormSchema(t) as never },
    onSubmit: ({ value }) => {
      if (warning) {
        toast.warning(
          t('purchases.overdraftPrompt', {
            shortfall: formatPkr(warning.shortfall ?? 0)
          })
        );
        return;
      }
      submitPurchase(value, false);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  const handleCancel = () => {
    router.push('/dashboard/purchases');
  };

  const handleConfirmOverdraft = () => {
    submitPurchase(form.state.values, true);
  };

  const handleSupplierChange = (id: string, supplier: SupplierPickerItem | null) => {
    form.setFieldValue('supplier_id', id);
    setSupplierCnic(formatPkCnic(supplier?.cnic) || null);
  };

  const handleOpeningStockChange = ({ value }: OpeningStockChangeArgs) => {
    if (value) form.setFieldValue('paid_now', 0);
  };

  const fetchSupplierPage = async (filters: PickerFetchFilters) =>
    toPickerPage(
      await listSuppliers({
        page: filters.page ?? 1,
        pageSize: filters.limit ?? 20,
        search: filters.search,
        isActive: true
      }),
      mapSupplierToPicker
    );

  return (
    <form className='w-full' onSubmit={handleSubmit}>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='space-y-8 lg:col-span-2'>
          <section className='space-y-4'>
            <h2 className='text-base font-semibold'>{t('dukaan.purchase.supplier')}</h2>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <form.Field
                name='supplier_id'
                children={(field) => {
                  const isInvalid = isFieldMetaInvalid(field.state.meta);
                  return (
                    <div className='space-y-1.5'>
                      <FormEntitySelect
                        name={field.name}
                        label={t('dukaan.purchase.supplier')}
                        required
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onValueChange={handleSupplierChange}
                        isInvalid={isInvalid}
                        errors={field.state.meta.errors}
                        queryKey={['suppliers', 'picker']}
                        fetchPage={fetchSupplierPage}
                        placeholder={t('dukaan.purchase.pickSupplier')}
                        searchPlaceholder={t('dukaan.purchase.searchSuppliers')}
                      />
                      {field.state.value ? (
                        <p className='text-muted-foreground text-xs'>
                          {supplierCnic
                            ? t('dukaan.purchase.supplierCnic', { cnic: supplierCnic })
                            : t('dukaan.purchase.supplierCnicMissing')}
                        </p>
                      ) : null}
                    </div>
                  );
                }}
              />
              <form.AppField
                name='supplier_invoice_ref'
                children={(field) => (
                  <field.TextField
                    label={t('dukaan.purchase.invoiceRef')}
                    maxLength={INPUT_LIMITS.invoiceRef}
                    placeholder={t('dukaan.purchase.invoiceRefPlaceholder')}
                  />
                )}
              />
            </div>
            <form.AppField
              name='is_opening_stock'
              listeners={{ onChange: handleOpeningStockChange }}
              children={(field) => (
                <field.CheckboxField label={t('dukaan.purchase.openingStock')} />
              )}
            />
          </section>

          <section className='space-y-5 border-t border-border/60 pt-6'>
            <h2 className='text-lg font-semibold'>{t('dukaan.purchase.items')}</h2>
            <form.AppField
              name='lines'
              mode='array'
              children={(field) => {
                const linesInvalid = isFieldMetaInvalid(field.state.meta);
                return (
                  <div className='space-y-6'>
                    {field.state.value.map((_, idx) => (
                      <PurchaseLineCard
                        key={idx}
                        form={form as never}
                        index={idx}
                        canRemove={field.state.value.length > 1}
                        onRemove={() => field.removeValue(idx)}
                      />
                    ))}
                    {linesInvalid ? (
                      <DialogFieldError message={joinFieldErrors(field.state.meta.errors)} />
                    ) : null}
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='w-full'
                      onClick={() => field.pushValue(emptyPurchaseLine())}
                    >
                      <Icons.add className='me-1.5 size-3.5' />
                      {t('dukaan.purchase.addLine')}
                    </Button>
                  </div>
                );
              }}
            />
          </section>
        </div>

        <aside className='lg:col-span-1'>
          <div className='lg:sticky lg:top-3 lg:z-10'>
            <form.Subscribe
              selector={selectPurchaseSummary}
              children={(summary) => (
                <PurchaseSummaryCard
                  isOpeningStock={summary.isOpeningStock}
                  lines={summary.lines}
                  paidNow={summary.paidNow}
                  warning={warning}
                  saving={save.isPending}
                  onConfirmOverdraft={handleConfirmOverdraft}
                  onCancel={handleCancel}
                  paidNowField={
                    <form.AppField
                      name='paid_now'
                      children={(subField) => (
                        <subField.TextField
                          label={t('dukaan.purchase.paidNow')}
                          type='number'
                          min={0}
                          max={INPUT_LIMITS.amountRupeesMax}
                          required
                          placeholder={t('dukaan.purchase.paidNowPlaceholder')}
                        />
                      )}
                    />
                  }
                />
              )}
            />
          </div>
        </aside>
      </div>
    </form>
  );
}
