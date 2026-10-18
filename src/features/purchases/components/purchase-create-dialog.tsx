'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useT } from '@/i18n/use-t';
import { useAppForm } from '@/lib/form';
import { INPUT_LIMITS } from '@/lib/input-limits';
import { isFieldMetaInvalid } from '@/lib/form-context';
import { todayIsoDate } from '@/lib/dates';
import { createClientRequestId, formatPkr, toPaisa } from '@/lib/dukaan/numbers';
import type {
  CreatePurchaseInput,
  CreatePurchaseItemInput,
  CreatePurchaseResult
} from '@/lib/api/types';
import type {
  PurchaseFormValues,
  PurchaseLineDraft,
  PurchaseCreateFormProps,
  PurchaseCreateDialogProps
} from '@/types/purchases';
import type { OverdraftPrompt, PickerFetchFilters } from '@/types';

import { purchaseKeys } from '../api/queries';
import { createPurchaseMutation } from '../api/mutations';
import { createPurchaseFormSchema, parseImeiList } from '../schemas/purchase-schema';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { FormEntitySelect } from '@/components/forms/form-entity-select';
import { listSuppliers } from '@/features/suppliers/api/service';
import { mapSupplierToPicker, toPickerPage } from '@/lib/api/picker';
import { PurchaseLineCard } from './purchase-line-card';

const emptyLine = (): PurchaseLineDraft => ({
  product_id: '',
  quantity: 1,
  unit_cost: 0,
  imeis_text: '',
  imei2_text: '',
  condition: 'NEW',
  tracking_type: undefined
});

export function PurchaseCreateForm({ onDone }: PurchaseCreateFormProps) {
  const qc = useQueryClient();
  const t = useT();
  const [clientRequestId] = useState(() => createClientRequestId());
  const [warning, setWarning] = useState<OverdraftPrompt | null>(null);

  const save = useMutation({
    ...createPurchaseMutation,
    onSuccess: (res: CreatePurchaseResult) => {
      if (res && 'confirmOverdraft' in res && res.confirmOverdraft) {
        setWarning({
          shortfall: res.shortfall,
          message: res.message
        });
        toast.warning(res.message || t('dukaan.actions.cashBelowZeroWarning'));
        return;
      }
      toast.success(
        res?.message || t('dukaan.purchase.saved', { purchaseNo: res?.purchase?.purchaseNo ?? '' })
      );
      void qc.invalidateQueries({ queryKey: purchaseKeys.all });
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const submitPurchase = (values: PurchaseFormValues, confirmOverdraft = false) => {
    const items: CreatePurchaseItemInput[] = values.lines
      .filter((l) => l.product_id)
      .map((l) => {
        const imeis = parseImeiList(l.imeis_text);
        return {
          productId: l.product_id,
          quantity: Number(l.quantity) || 1,
          unitCost: toPaisa(Number(l.unit_cost) || 0),
          condition: l.condition,
          imeis: l.tracking_type === 'SERIALIZED' && imeis.length > 0 ? imeis : undefined
        };
      });

    const payload: CreatePurchaseInput = {
      clientRequestId,
      supplierId: values.supplier_id,
      supplierInvoiceRef: values.supplier_invoice_ref?.trim() || undefined,
      purchaseDate: todayIsoDate(),
      isOpeningStock: values.is_opening_stock,
      paidNow: values.is_opening_stock ? 0 : toPaisa(Number(values.paid_now) || 0),
      confirmOverdraft,
      items
    };

    save.mutate(payload);
  };

  const form = useAppForm({
    defaultValues: {
      supplier_id: '',
      supplier_invoice_ref: '',
      is_opening_stock: false,
      paid_now: 0,
      lines: [emptyLine()]
    },
    validators: { onSubmit: createPurchaseFormSchema(t) },
    onSubmit: ({ value }) => {
      setWarning(null);
      submitPurchase(value, false);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit();
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
    <form className='flex min-h-0 flex-1 flex-col' onSubmit={handleSubmit}>
      <div className='no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4'>
        <section className='space-y-3'>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <form.Field
              name='supplier_id'
              children={(field) => {
                const isInvalid = isFieldMetaInvalid(field.state.meta);
                return (
                  <FormEntitySelect
                    name={field.name}
                    label={t('dukaan.purchase.supplier')}
                    required
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onValueChange={(id) => field.handleChange(id)}
                    isInvalid={isInvalid}
                    errors={field.state.meta.errors}
                    queryKey={['suppliers', 'picker']}
                    fetchPage={fetchSupplierPage}
                    placeholder={t('dukaan.purchase.pickSupplier')}
                    searchPlaceholder={t('dukaan.purchase.searchSuppliers')}
                  />
                );
              }}
            />
            <form.AppField
              name='supplier_invoice_ref'
              children={(field) => (
                <field.TextField
                  label={t('dukaan.purchase.invoiceRef')}
                  maxLength={INPUT_LIMITS.invoiceRef}
                />
              )}
            />
          </div>
          <div className='rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5'>
            <form.AppField
              name='is_opening_stock'
              listeners={{
                onChange: ({ value }) => {
                  if (value) form.setFieldValue('paid_now', 0);
                }
              }}
              children={(field) => (
                <field.CheckboxField label={t('dukaan.purchase.openingStock')} />
              )}
            />
          </div>
        </section>

        <section className='space-y-3'>
          <div className='flex items-center justify-between gap-2'>
            <h3 className='text-sm font-semibold'>{t('dukaan.purchase.items')}</h3>
          </div>
          <form.AppField
            name='lines'
            mode='array'
            children={(field) => {
              const linesInvalid = isFieldMetaInvalid(field.state.meta);
              return (
                <div className='space-y-3'>
                  {field.state.value.map((_, idx) => (
                    <PurchaseLineCard
                      key={idx}
                      form={form}
                      index={idx}
                      canRemove={field.state.value.length > 1}
                      onRemove={() => {
                        field.removeValue(idx);
                      }}
                    />
                  ))}
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='w-full border-dashed sm:w-auto'
                    onClick={() => field.pushValue(emptyLine())}
                  >
                    <Icons.add className='me-1.5 size-4' />
                    {t('dukaan.purchase.addLine')}
                  </Button>
                  {linesInvalid ? (
                    <DialogFieldError
                      message={
                        field.state.meta.errors
                          .map((err) =>
                            typeof err === 'string' ? err : (err?.message ?? String(err))
                          )
                          .filter(Boolean)
                          .join(' ') || undefined
                      }
                    />
                  ) : null}
                </div>
              );
            }}
          />
        </section>

        <form.Subscribe
          selector={(s) => ({
            isOpeningStock: s.values.is_opening_stock,
            lines: s.values.lines,
            paidNow: s.values.paid_now
          })}
          children={({ isOpeningStock, lines, paidNow }) => {
            const totalRs = lines.reduce(
              (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_cost) || 0),
              0
            );
            const dueRs = Math.max(0, totalRs - (Number(paidNow) || 0));
            return (
              <section className='rounded-xl border border-border/80 bg-muted/25 p-3'>
                {isOpeningStock ? (
                  <p className='text-sm font-medium tabular-nums'>
                    {t('dukaan.purchase.openingStockTotal', {
                      total: formatPkr(toPaisa(totalRs))
                    })}
                    <span className='ms-1 font-normal text-muted-foreground'>
                      {t('dukaan.purchase.noCashMovement')}
                    </span>
                  </p>
                ) : (
                  <div className='grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-end'>
                    <form.AppField
                      name='paid_now'
                      children={(subField) => (
                        <subField.TextField
                          label={t('dukaan.purchase.paidNow')}
                          type='number'
                          min={0}
                          max={INPUT_LIMITS.amountRupeesMax}
                          required
                        />
                      )}
                    />
                    <div className='flex flex-col gap-1 text-end sm:pb-0.5'>
                      <div className='flex items-baseline justify-end gap-2'>
                        <span className='text-xs text-muted-foreground'>
                          {t('dukaan.purchase.totalLabel')}
                        </span>
                        <span className='text-base font-semibold tabular-nums'>
                          {formatPkr(toPaisa(totalRs))}
                        </span>
                      </div>
                      <div className='flex items-baseline justify-end gap-2'>
                        <span className='text-xs text-muted-foreground'>
                          {t('dukaan.purchase.balanceDue')}
                        </span>
                        <span className='text-sm font-medium tabular-nums text-amber-700 dark:text-amber-400'>
                          {formatPkr(toPaisa(dueRs))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          }}
        />

        {warning ? (
          <div className='rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm'>
            <p className='font-medium text-amber-900 dark:text-amber-200'>
              {warning.message || t('purchases.overdraftWarning')}
            </p>
            {warning.shortfall ? (
              <p className='mt-1 text-xs text-muted-foreground'>
                {t('purchases.shortfall')} {formatPkr(warning.shortfall)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className='shrink-0 border-t bg-popover px-4 py-3'>
        {warning ? (
          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <DialogCancelButton onClick={() => setWarning(null)} disabled={save.isPending} />
            <DialogPrimaryButton
              mode='add'
              type='button'
              loading={save.isPending}
              onClick={() => submitPurchase(form.state.values, true)}
            />
          </div>
        ) : (
          <DialogFooter className='mx-0 mb-0 gap-2 px-0 sm:gap-2'>
            {onDone ? <DialogCancelButton onClick={onDone} disabled={save.isPending} /> : null}
            <DialogPrimaryButton mode='add' loading={save.isPending} />
          </DialogFooter>
        )}
      </div>
    </form>
  );
}

export function PurchaseCreateDialog({
  open,
  onOpenChange,
  clearDefaultQuery
}: PurchaseCreateDialogProps) {
  const router = useRouter();
  const t = useT();

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next && clearDefaultQuery) router.replace('/dashboard/purchases');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='flex max-h-[90dvh] w-full flex-col gap-0 overflow-hidden p-0 data-[size]:max-w-none sm:max-w-3xl max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[90dvh] max-sm:translate-y-0 max-sm:rounded-t-[var(--radius)] max-sm:rounded-b-none'>
        <DialogHeader className='shrink-0 border-b px-4 pt-4 pb-3 pe-12'>
          <DialogTitle>{t('dukaan.purchase.newTitle')}</DialogTitle>
          <DialogDescription>{t('dukaan.purchase.newDescription')}</DialogDescription>
        </DialogHeader>
        {open ? (
          <PurchaseCreateForm key='purchase-create' onDone={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
