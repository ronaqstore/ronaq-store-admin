'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { FormEntitySelect } from '@/components/forms/form-entity-select';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FieldGroup } from '@/components/ui/field';
import { useT } from '@/i18n/use-t';
import { useAppForm } from '@/lib/form';
import { INPUT_LIMITS } from '@/lib/input-limits';
import { isFieldMetaInvalid } from '@/lib/form-context';
import { createClientRequestId, fromPaisa } from '@/lib/dukaan/numbers';
import { isValidationApiError } from '@/lib/api/is-validation-error';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import type { SubFieldApi } from '@/types/forms';
import type { PickerFetchFilters, ProductPickerItem } from '@/types/picker';
import { listCustomers } from '@/features/customers/api/service';
import { listProducts } from '@/features/products/api/service';
import { mapProductToPicker, toPickerPage } from '@/lib/api/picker';
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
import { SaleLineImeiField } from './sale-line-imei-field';
import { SaleTotalsSummary } from './sale-totals-summary';
import type { SaleDTO } from '@/lib/api/types';
import type {
  SaleFormSubmitContext,
  SaleFormValues,
  SaleCreateFormProps,
  SaleUnitPriceHint
} from '@/types/sales';
import { EMPTY_FORM_NUMBER } from '@/types/common';

export function SaleCreateForm({ onDone }: SaleCreateFormProps) {
  const qc = useQueryClient();
  const router = useRouter();
  const t = useT();
  const [clientRequestId] = useState(() => createClientRequestId());
  const [formApiError, setFormApiError] = useState<string | null>(null);

  const save = useMutation({
    ...createSaleMutation,
    onSuccess: (res: SaleDTO) => {
      invalidateDomains({ queryClient: qc, domains: SALE_SYNC_DOMAINS });
      onDone?.();
      router.push(`/dashboard/sales/${res.id}`);
      toastSuccessAfterClose(t('dukaan.sale.saved', { saleNo: res.saleNo }));
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
      save.mutate(
        buildCreateSalePayload(
          value.lines,
          value.customer_id,
          Number(value.discount) || 0,
          Number(value.paid_now) || 0,
          value.notes,
          clientRequestId
        )
      );
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
    const trackingType =
      product?.tracking_type ??
      (product as { trackingType?: ProductPickerItem['tracking_type'] } | null)?.trackingType;
    const isPhone = trackingType === 'SERIALIZED';
    subField.handleChange(id);
    form.setFieldValue(
      `lines[${idx}].unit_price`,
      product ? fromPaisa(product.default_selling_price) : EMPTY_FORM_NUMBER
    );
    form.setFieldValue(`lines[${idx}].tracking_type`, trackingType ?? undefined);
    form.setFieldValue(`lines[${idx}].inventory_unit_id`, '');
    form.setFieldValue(`lines[${idx}].unit_condition`, undefined);
    form.setFieldValue(`lines[${idx}].warranty_days`, '');
    form.setFieldValue(
      `lines[${idx}].authenticity`,
      isPhone ? null : (product?.authenticity ?? null)
    );
    form.setFieldValue(`lines[${idx}].quantity`, 1);
  };

  const handleImeiChange = (
    subField: SubFieldApi,
    idx: number,
    unitId: string,
    condition?: 'NEW' | 'USED',
    currentWarrantyDays?: string,
    unit?: SaleUnitPriceHint
  ) => {
    subField.handleChange(unitId);
    form.setFieldValue(`lines[${idx}].unit_condition`, condition);
    form.setFieldValue(
      `lines[${idx}].warranty_days`,
      condition === 'USED' ? (currentWarrantyDays || '') : ''
    );
    if (unit?.effectivePrice != null) {
      form.setFieldValue(
        `lines[${idx}].unit_price`,
        fromPaisa(unit.effectivePrice)
      );
    }
  };

  const fetchProductPage = async (filters: PickerFetchFilters) =>
    toPickerPage(
      await listProducts({
        page: filters.page ?? 1,
        pageSize: filters.limit ?? 20,
        search: filters.search,
        isActive: true,
        inStockOnly: true
      }),
      mapProductToPicker
    );

  return (
    <form className='space-y-4' onSubmit={handleSubmit}>
      {formApiError ? (
        <Alert variant='destructive'>
          <Icons.warning />
          <AlertDescription>{formApiError}</AlertDescription>
        </Alert>
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
                  <form.Subscribe
                    key={idx}
                    selector={(s) => {
                      const current = s.values.lines[idx];
                      return {
                        isPhone: isPhoneSaleLine(current),
                        productId: current?.product_id ?? '',
                        authenticity: current?.authenticity ?? null,
                        unitCondition: current?.unit_condition,
                        warrantyDays: current?.warranty_days ?? ''
                      };
                    }}
                    children={({ isPhone, productId, authenticity, unitCondition, warrantyDays }) => (
                  <div
                    className='relative grid gap-2 rounded-lg border p-3 pe-24 md:grid-cols-4'
                  >
                    {field.state.value.length > 1 && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='absolute inset-e-2 top-2 h-7 text-muted-foreground hover:text-destructive'
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
                          placeholder={t('dukaan.sale.quantityPlaceholder')}
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
                          placeholder={t('dukaan.sale.unitPricePlaceholder')}
                        />
                      )}
                    />
                    {!isPhone && authenticity ? (
                      <div className='md:col-span-4 space-y-2'>
                        <Badge
                          variant={authenticity === 'ORIGINAL' ? 'default' : 'secondary'}
                          className='text-xs'
                        >
                          {authenticity === 'ORIGINAL'
                            ? t('dukaan.product.authenticityOriginal')
                            : t('dukaan.product.authenticityCopy')}
                        </Badge>
                        <Alert>
                          <Icons.warning />
                          <AlertDescription>
                            {t('dukaan.sale.authenticityTellCustomer')}
                          </AlertDescription>
                        </Alert>
                      </div>
                    ) : null}
                    {isPhone && productId ? (
                      <div className='md:col-span-4 space-y-3'>
                        <form.Field
                          name={`lines[${idx}].inventory_unit_id`}
                          children={(subField) => {
                            const isInvalid = isFieldMetaInvalid(subField.state.meta);
                            return (
                              <SaleLineImeiField
                                productId={productId}
                                name={subField.name}
                                value={subField.state.value ?? ''}
                                onBlur={subField.handleBlur}
                                onValueChange={(unitId, condition, unit) =>
                                  handleImeiChange(
                                    subField,
                                    idx,
                                    unitId,
                                    condition,
                                    warrantyDays,
                                    unit
                                  )
                                }
                                isInvalid={isInvalid}
                                errors={subField.state.meta.errors}
                                excludedUnitIds={excludedUnitIds}
                              />
                            );
                          }}
                        />
                        {unitCondition === 'USED' ? (
                          <form.AppField
                            name={`lines[${idx}].warranty_days`}
                            children={(subField) => (
                              <subField.RadioGroupField
                                label={t('dukaan.sale.shopWarranty')}
                                required
                                description={t('dukaan.sale.shopWarrantyHelp')}
                                options={[
                                  { value: '1', label: t('dukaan.sale.warrantyDays', { days: 1 }) },
                                  { value: '2', label: t('dukaan.sale.warrantyDays', { days: 2 }) },
                                  { value: '3', label: t('dukaan.sale.warrantyDays', { days: 3 }) }
                                ]}
                              />
                            )}
                          />
                        ) : unitCondition === 'NEW' ? (
                          <Alert>
                            <Icons.warning />
                            <AlertDescription>
                              {t('dukaan.sale.companyWarranty')}
                            </AlertDescription>
                          </Alert>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                    )}
                  />
                );
              })}
              <div className='flex justify-end'>
                <Button type='button' variant='outline' onClick={() => field.pushValue({ ...emptySaleLine })}>
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
