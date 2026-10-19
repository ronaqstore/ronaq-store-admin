'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from '@/i18n/navigation';
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
  PurchaseLineDraft
} from '@/types/purchases';
import type { OverdraftPrompt, PickerFetchFilters, SupplierPickerItem } from '@/types';

import { purchaseKeys } from '../api/queries';
import { createPurchaseMutation } from '../api/mutations';
import { createPurchaseFormSchema } from '../schemas/purchase-schema';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { FormEntitySelect } from '@/components/forms/form-entity-select';
import { listSuppliers } from '@/features/suppliers/api/service';
import { mapSupplierToPicker, toPickerPage } from '@/lib/api/picker';
import { PurchaseLineCard } from './purchase-line-card';

const emptyLine = (): PurchaseLineDraft => ({
  product_id: '',
  product_label: '',
  quantity: 1,
  unit_cost: 0,
  phone_units: [],
  condition: 'NEW',
  tracking_type: undefined,
  brand_name: null
});

export function PurchaseCreatePageClient() {
  const qc = useQueryClient();
  const router = useRouter();
  const t = useT();
  const [clientRequestId] = useState(() => createClientRequestId());
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
        toast.warning(res.message || t('dukaan.actions.cashBelowZeroWarning'));
        return;
      }
      toast.success(
        res?.message || t('dukaan.purchase.saved', { purchaseNo: res?.purchase?.purchaseNo ?? '' })
      );
      void qc.invalidateQueries({ queryKey: purchaseKeys.all });
      router.push('/dashboard/purchases');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const submitPurchase = (values: PurchaseFormValues, confirmOverdraft = false) => {
    const items: CreatePurchaseItemInput[] = values.lines
      .filter((l) => l.product_id)
      .map((l) => {
        const phoneUnits =
          l.tracking_type === 'SERIALIZED'
            ? (l.phone_units ?? []).map((u) => {
                const battery =
                  u.battery_health === '' || u.battery_health == null
                    ? undefined
                    : Number(u.battery_health);
                const ask =
                  u.asking_price === '' || u.asking_price == null
                    ? undefined
                    : toPaisa(Number(u.asking_price));
                const notes = u.defect_notes?.trim();
                return {
                  imei1: u.imei1.trim(),
                  imei2: u.imei2.trim(),
                  condition: u.condition,
                  ...(battery != null && !Number.isNaN(battery)
                    ? { batteryHealth: battery }
                    : {}),
                  ...(ask != null && !Number.isNaN(ask) ? { askingPrice: ask } : {}),
                  ...(notes ? { defectNotes: notes } : {})
                };
              })
            : undefined;
        return {
          productId: l.product_id,
          quantity: Number(l.quantity) || 1,
          unitCost: toPaisa(Number(l.unit_cost) || 0),
          condition: l.condition,
          phoneUnits: phoneUnits && phoneUnits.length > 0 ? phoneUnits : undefined
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

  const handleCancel = () => {
    router.push('/dashboard/purchases');
  };

  const handleConfirmOverdraft = () => {
    submitPurchase(form.state.values, true);
  };

  const handleSupplierChange = (
    id: string,
    supplier: SupplierPickerItem | null
  ) => {
    form.setFieldValue('supplier_id', id);
    setSupplierCnic(supplier?.cnic?.trim() || null);
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
      <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-3'>
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
              listeners={{
                onChange: ({ value }) => {
                  if (value) form.setFieldValue('paid_now', 0);
                }
              }}
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
                        form={form}
                        index={idx}
                        canRemove={field.state.value.length > 1}
                        onRemove={() => field.removeValue(idx)}
                      />
                    ))}
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
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='w-full'
                      onClick={() => field.pushValue(emptyLine())}
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

        <div className='space-y-6 lg:col-span-1'>
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
                <Card className='lg:sticky lg:top-20 z-10'>
                  <CardHeader>
                    <CardTitle>{t('dukaan.purchase.totalLabel')}</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='rounded-xl border border-border/80 bg-muted/40 p-4'>
                      <div className='flex items-baseline justify-between'>
                        <span className='text-muted-foreground text-sm font-medium'>
                          {t('dukaan.purchase.totalLabel')}
                        </span>
                        <span className='text-2xl font-bold tracking-tight tabular-nums'>
                          {formatPkr(toPaisa(totalRs))}
                        </span>
                      </div>
                    </div>

                    {isOpeningStock ? (
                      <p className='text-muted-foreground text-xs font-normal'>
                        {t('dukaan.purchase.noCashMovement')}
                      </p>
                    ) : (
                      <div className='space-y-4'>
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
                        <div className='flex items-baseline justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2'>
                          <span className='text-muted-foreground text-xs font-medium'>
                            {t('dukaan.purchase.balanceDue')}
                          </span>
                          <span className='text-base font-semibold tabular-nums text-amber-700 dark:text-amber-400'>
                            {formatPkr(toPaisa(dueRs))}
                          </span>
                        </div>
                      </div>
                    )}

                    {warning ? (
                      <div className='rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm'>
                        <p className='font-medium text-amber-900 dark:text-amber-200'>
                          {warning.message || t('purchases.overdraftWarning')}
                        </p>
                        {warning.shortfall ? (
                          <p className='text-muted-foreground mt-1 text-xs'>
                            {t('purchases.shortfall')} {formatPkr(warning.shortfall)}
                          </p>
                        ) : null}
                        <Button
                          type='button'
                          variant='destructive'
                          size='sm'
                          className='mt-3 w-full'
                          disabled={save.isPending}
                          onClick={handleConfirmOverdraft}
                        >
                          {t('common.confirm')}
                        </Button>
                      </div>
                    ) : null}

                    <div className='space-y-2 pt-2'>
                      <Button
                        type='submit'
                        className='w-full'
                        disabled={save.isPending}
                      >
                        {save.isPending ? (
                          <Icons.spinner className='me-2 size-4 animate-spin' />
                        ) : (
                          <Icons.check className='me-2 size-4' />
                        )}
                        {t('common.save')}
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        className='w-full'
                        disabled={save.isPending}
                        onClick={handleCancel}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }}
          />
        </div>
      </div>
    </form>
  );
}
