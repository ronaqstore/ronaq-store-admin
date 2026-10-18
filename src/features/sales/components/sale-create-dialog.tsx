'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { FormEntitySelect } from '@/components/forms/form-entity-select';
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
import { FieldGroup } from '@/components/ui/field';
import { useT } from '@/i18n/use-t';
import { useAppForm } from '@/lib/form';
import { INPUT_LIMITS } from '@/lib/input-limits';
import { isFieldMetaInvalid } from '@/lib/form-context';
import { todayIsoDate } from '@/lib/dates';
import { createClientRequestId, formatPkr, fromPaisa, toPaisa } from '@/lib/dukaan/numbers';
import type { SubFieldApi } from '@/types/forms';
import type { PickerFetchFilters, ProductPickerItem } from '@/types/picker';
import { listCustomers } from '@/features/customers/api/service';
import { listProducts } from '@/features/products/api/service';
import { mapProductToPicker, toPickerPage } from '@/lib/api/picker';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { saleKeys } from '../api/queries';
import { createSaleMutation } from '../api/mutations';
import { createSaleFormSchema } from '../schemas/sale-schema';
import { SaleLineImeiField } from './sale-line-imei-field';
import type { CreateSaleInput, CreateSaleItemInput, SaleDTO } from '@/lib/api/types';
import type {
  SaleCreateDialogProps,
  SaleLineItem,
  SaleFormSubmitContext,
  SaleCreateFormProps
} from '@/types/sales';

export function SaleCreateDialog({ open, onOpenChange, clearDefaultQuery }: SaleCreateDialogProps) {
  const router = useRouter();
  const t = useT();

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next && clearDefaultQuery) router.replace('/dashboard/sales');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl'>
        <DialogHeader className='shrink-0 px-4 pt-4 pe-12'>
          <DialogTitle>{t('dukaan.sale.newTitle')}</DialogTitle>
          <DialogDescription>{t('dukaan.sale.newDescription')}</DialogDescription>
        </DialogHeader>
        <div className='no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4'>
          <Suspense
            fallback={<p className='text-muted-foreground text-sm'>{t('dukaan.sale.loading')}</p>}
          >
            <SaleCreateForm onDone={() => onOpenChange(false)} />
          </Suspense>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const emptySaleLine: SaleLineItem = {
  product_id: '',
  quantity: 1,
  unit_price: 0,
  inventory_unit_id: ''
};

export function SaleCreateForm({ onDone }: SaleCreateFormProps) {
  const qc = useQueryClient();
  const router = useRouter();
  const t = useT();
  const [clientRequestId] = useState(() => createClientRequestId());

  const save = useMutation({
    ...createSaleMutation,
    onSuccess: (res: SaleDTO) => {
      toast.success(t('dukaan.sale.saved', { saleNo: res.saleNo }));
      void qc.invalidateQueries({ queryKey: saleKeys.all });
      void qc.invalidateQueries({ queryKey: ['inventory'] });
      onDone?.();
      router.push(`/dashboard/sales/${res.id}`);
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const form = useAppForm({
    defaultValues: {
      customer_id: '__walkin__',
      discount: 0,
      paid_now: 0,
      notes: '',
      lines: [{ ...emptySaleLine }]
    },
    validators: { onSubmit: createSaleFormSchema(t) as never },
    onSubmit: ({ value }: SaleFormSubmitContext) => {
      const items: CreateSaleItemInput[] = value.lines
        .filter((l) => l.product_id)
        .map((l) => ({
          productId: l.product_id,
          quantity: Number(l.quantity) || 1,
          unitPrice: toPaisa(Number(l.unit_price) || 0),
          inventoryUnitId: l.inventory_unit_id || undefined
        }));

      const payload: CreateSaleInput = {
        clientRequestId,
        saleDate: todayIsoDate(),
        customerId: value.customer_id === '__walkin__' ? undefined : value.customer_id,
        items,
        discount: toPaisa(Number(value.discount) || 0),
        paidNow: toPaisa(Number(value.paid_now) || 0),
        notes: value.notes?.trim() || undefined
      };

      save.mutate(payload);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  const handleProductSelect = (
    idx: number,
    subField: SubFieldApi,
    id: string,
    product: ProductPickerItem | null
  ) => {
    subField.handleChange(id);
    form.setFieldValue(
      `lines[${idx}].unit_price`,
      product ? fromPaisa(product.default_selling_price) : 0
    );
    form.setFieldValue(`lines[${idx}].tracking_type`, product?.tracking_type);
    form.setFieldValue(`lines[${idx}].inventory_unit_id`, '');
    form.setFieldValue(`lines[${idx}].quantity`, 1);
  };

  const fetchProductPage = async (filters: PickerFetchFilters) =>
    toPickerPage(
      await listProducts({
        page: filters.page ?? 1,
        pageSize: filters.limit ?? 20,
        search: filters.search,
        isActive: true
      }),
      mapProductToPicker
    );


  return (
    <form className='space-y-4' onSubmit={handleSubmit}>
      <FieldGroup className='max-w-md gap-3'>
        <form.Subscribe
          selector={(s) => s.values.lines}
          children={(lines) => {
            const hasPhone = lines.some((l) => l.tracking_type === 'SERIALIZED');
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
              {field.state.value.map((line, idx) => {
                const isPhone = line.tracking_type === 'SERIALIZED';
                const excludedUnitIds = field.state.value
                  .map((other, otherIdx) =>
                    otherIdx !== idx ? other.inventory_unit_id : undefined
                  )
                  .filter((id): id is string => !!id);
                return (
                  <div
                    key={idx}
                    className='relative grid gap-2 rounded-lg border p-3 pe-24 md:grid-cols-4'
                  >
                    {field.state.value.length > 1 && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='absolute end-2 top-2 h-7 text-muted-foreground hover:text-destructive'
                        onClick={() => field.removeValue(idx)}
                      >
                        <Icons.trash className='me-1 h-4 w-4' />
                        {t('common.remove')}
                      </Button>
                    )}
                    <div className='md:col-span-2'>
                      <form.Field
                        name={`lines[${idx}].product_id`}
                        children={(subField) => {
                          const isInvalid = isFieldMetaInvalid(subField.state.meta);
                          return (
                            <FormEntitySelect<ProductPickerItem>
                              name={subField.name}
                              label={t('dukaan.sale.product')}
                              required
                              value={subField.state.value}
                              onBlur={subField.handleBlur}
                              onValueChange={(id, product) =>
                                handleProductSelect(idx, subField, id, product)
                              }
                              isInvalid={isInvalid}
                              errors={subField.state.meta.errors}
                              queryKey={['products', 'picker']}
                              fetchPage={fetchProductPage}
                              placeholder={t('dukaan.sale.selectProduct')}
                              searchPlaceholder={t('dukaan.sale.searchProducts')}
                            />
                          );
                        }}
                      />
                    </div>
                    <form.AppField
                      name={`lines[${idx}].quantity`}
                      children={(subField) => (
                        <subField.TextField
                          label={t('dukaan.sale.quantity')}
                          type='number'
                          min={1}
                          max={isPhone ? 1 : INPUT_LIMITS.quantityMax}
                          required
                          disabled={isPhone}
                        />
                      )}
                    />
                    <form.AppField
                      name={`lines[${idx}].unit_price`}
                      children={(subField) => (
                        <subField.TextField
                          label={t('dukaan.sale.unitPrice')}
                          type='number'
                          min={0}
                          max={INPUT_LIMITS.amountRupeesMax}
                          required
                        />
                      )}
                    />
                    {isPhone && line.product_id ? (
                      <div className='md:col-span-4'>
                        <form.Field
                          name={`lines[${idx}].inventory_unit_id`}
                          children={(subField) => {
                            const isInvalid = isFieldMetaInvalid(subField.state.meta);
                            return (
                              <SaleLineImeiField
                                productId={line.product_id}
                                name={subField.name}
                                value={subField.state.value ?? ''}
                                onBlur={subField.handleBlur}
                                onValueChange={(unitId) => subField.handleChange(unitId)}
                                isInvalid={isInvalid}
                                errors={subField.state.meta.errors}
                                excludedUnitIds={excludedUnitIds}
                              />
                            );
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
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
              required
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
          selector={(s) => ({
            lines: s.values.lines,
            discount: s.values.discount,
            paidNow: s.values.paid_now
          })}
          children={({ lines, discount, paidNow }) => {
            const subtotalRs = lines.reduce(
              (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
              0
            );
            const totalRs = Math.max(0, subtotalRs - (Number(discount) || 0));
            const udharRs = Math.max(0, totalRs - (Number(paidNow) || 0));
            return (
              <p className='flex items-center text-muted-foreground text-sm sm:col-span-2'>
                {t('common.subtotal')}: {formatPkr(toPaisa(subtotalRs))} · {t('common.total')}:{' '}
                {formatPkr(toPaisa(totalRs))}
                {udharRs > 0 &&
                  ` · ${t('dukaan.sale.outstandingUdhar')}: ${formatPkr(toPaisa(udharRs))}`}
              </p>
            );
          }}
        />
      </div>

      <DialogFooter className='mx-0 mb-0 px-0 gap-2 sm:gap-2.5'>
        {onDone ? <DialogCancelButton onClick={onDone} disabled={save.isPending} /> : null}
        <DialogPrimaryButton mode='add' loading={save.isPending} />
      </DialogFooter>
    </form>
  );
}

