'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { FormEntitySelect } from '@/components/forms/form-entity-select';
import { useT } from '@/i18n/use-t';
import { withForm } from '@/lib/form';
import { isFieldMetaInvalid } from '@/lib/form-context';
import { INPUT_LIMITS } from '@/lib/input-limits';
import { formatPkr, fromPaisa, toPaisa } from '@/lib/dukaan/numbers';
import { listProducts } from '@/features/products/api/service';
import { mapProductToPicker, toPickerPage } from '@/lib/api/picker';
import type { PurchaseFormValues, PurchaseLineDraft } from '@/types/purchases';
import type { PickerFetchFilters, ProductPickerItem } from '@/types';
import type { SubFieldApi } from '@/types/forms';
import { EMPTY_FORM_NUMBER } from '@/types/common';
import { isAppleBrandName } from '@/lib/device-family';
import { resizePhoneUnits } from '../schemas/purchase-schema';
import { QuickVariantDialog } from './quick-variant-dialog';

const emptyDefaults: PurchaseFormValues = {
  supplier_id: '',
  supplier_invoice_ref: '',
  is_opening_stock: false,
  paid_now: EMPTY_FORM_NUMBER,
  lines: [] as PurchaseLineDraft[]
};

export const PurchaseLineCard = withForm({
  defaultValues: emptyDefaults,
  props: {
    index: 0,
    canRemove: false,
    onRemove: (() => undefined) as () => void
  },
  render: function PurchaseLineCardRender({ form, index, canRemove, onRemove }) {
    const t = useT();
    const [quickOpen, setQuickOpen] = useState(false);

    const applyProduct = (id: string, product: ProductPickerItem | null) => {
      form.setFieldValue(`lines[${index}].product_id`, id);
      form.setFieldValue(`lines[${index}].product_label`, product?.name ?? '');
      form.setFieldValue(
        `lines[${index}].unit_cost`,
        product ? fromPaisa(product.default_purchase_price) : 0
      );
      form.setFieldValue(`lines[${index}].tracking_type`, product?.tracking_type);
      form.setFieldValue(`lines[${index}].brand_name`, product?.brand_name ?? null);
      const qty = Number(form.getFieldValue(`lines[${index}].quantity`)) || 1;
      const condition =
        (form.getFieldValue(`lines[${index}].condition`) as 'NEW' | 'USED') || 'NEW';
      if (product?.tracking_type === 'SERIALIZED') {
        form.setFieldValue(
          `lines[${index}].phone_units`,
          resizePhoneUnits([], qty, condition)
        );
      } else {
        form.setFieldValue(`lines[${index}].phone_units`, []);
      }
    };

    const handleProductSelect = (
      subField: SubFieldApi,
      id: string,
      product: ProductPickerItem | null
    ) => {
      subField.handleChange(id);
      applyProduct(id, product);
    };

    const handleQuickVariantCreated = (
      subField: SubFieldApi,
      product: ProductPickerItem
    ) => {
      subField.handleChange(product.id);
      applyProduct(product.id, product);
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
      <form.Subscribe
        selector={(s) => ({
          productLabel: s.values.lines[index]?.product_label?.trim() || '',
          trackingType: s.values.lines[index]?.tracking_type,
          brandName: s.values.lines[index]?.brand_name,
          units: s.values.lines[index]?.phone_units ?? []
        })}
        children={({ productLabel, trackingType, brandName, units }) => {
          const title =
            productLabel ||
            t('dukaan.purchase.lineUntitled') + ` ${index + 1}`;

          return (
            <article className='rounded-xl border border-border bg-background p-4 shadow-xs sm:p-5'>
              <header className='mb-4 flex items-start justify-between gap-3 border-b border-border/70 pb-3'>
                <div className='min-w-0 space-y-0.5'>
                  <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                    {t('dukaan.purchase.lineNumber', { n: index + 1 })}
                  </p>
                  <h3 className='truncate text-lg font-semibold leading-snug'>{title}</h3>
                </div>
                {canRemove ? (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='shrink-0'
                    onClick={onRemove}
                  >
                    <Icons.trash className='me-1.5 size-3.5' />
                    {t('common.remove')}
                  </Button>
                ) : null}
              </header>

              <div className='space-y-4'>
                <form.Field
                  name={`lines[${index}].product_id`}
                  children={(subField) => {
                    const isInvalid = isFieldMetaInvalid(subField.state.meta);
                    return (
                      <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
                        <div className='min-w-0 flex-1'>
                          <FormEntitySelect<ProductPickerItem>
                            name={subField.name}
                            label={t('dukaan.purchase.product')}
                            required
                            value={subField.state.value}
                            onBlur={subField.handleBlur}
                            onValueChange={(id, product) =>
                              handleProductSelect(subField, id, product)
                            }
                            isInvalid={isInvalid}
                            errors={subField.state.meta.errors}
                            queryKey={['products', 'picker']}
                            fetchPage={fetchProductPage}
                            placeholder={t('dukaan.purchase.pickProductFirst')}
                            searchPlaceholder={t('dukaan.purchase.searchProducts')}
                            selectedLabel={productLabel || undefined}
                          />
                        </div>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='shrink-0'
                          onClick={() => setQuickOpen(true)}
                        >
                          <Icons.add className='me-1.5 size-3.5' />
                          {t('dukaan.purchase.quickVariant')}
                        </Button>
                        <QuickVariantDialog
                          open={quickOpen}
                          onOpenChange={setQuickOpen}
                          onCreated={(product) =>
                            handleQuickVariantCreated(subField, product)
                          }
                        />
                      </div>
                    );
                  }}
                />

                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                  <form.AppField
                    name={`lines[${index}].quantity`}
                    listeners={{
                      onChange: ({ value }) => {
                        if (trackingType !== 'SERIALIZED') return;
                        const qty = Math.max(1, Number(value) || 1);
                        const capped = Math.min(qty, INPUT_LIMITS.imeiCountMax);
                        const current =
                          form.getFieldValue(`lines[${index}].phone_units`) ?? [];
                        const condition =
                          (form.getFieldValue(`lines[${index}].condition`) as
                            | 'NEW'
                            | 'USED') || 'NEW';
                        form.setFieldValue(
                          `lines[${index}].phone_units`,
                          resizePhoneUnits(current, capped, condition)
                        );
                      }
                    }}
                    children={(subField) => (
                      <subField.TextField
                        label={t('dukaan.purchase.quantity')}
                        type='number'
                        min={1}
                        max={
                          trackingType === 'SERIALIZED'
                            ? INPUT_LIMITS.imeiCountMax
                            : INPUT_LIMITS.quantityMax
                        }
                        required
                        placeholder={t('dukaan.purchase.quantityPlaceholder')}
                      />
                    )}
                  />
                  <form.AppField
                    name={`lines[${index}].unit_cost`}
                    children={(subField) => (
                      <subField.TextField
                        label={t('dukaan.purchase.unitCost')}
                        type='number'
                        min={0}
                        max={INPUT_LIMITS.amountRupeesMax}
                        required
                        placeholder={t('dukaan.purchase.unitCostPlaceholder')}
                      />
                    )}
                  />
                  <form.Subscribe
                    selector={(s) => ({
                      qty: s.values.lines[index]?.quantity,
                      cost: s.values.lines[index]?.unit_cost
                    })}
                    children={({ qty, cost }) => {
                      const lineRs = (Number(qty) || 0) * (Number(cost) || 0);
                      return (
                        <div className='col-span-2 flex flex-col justify-end sm:col-span-1'>
                          <p className='mb-1.5 text-sm font-medium'>
                            {t('dukaan.purchase.lineHeader')}
                          </p>
                          <div className='flex h-9 items-center text-base font-semibold tabular-nums'>
                            {formatPkr(toPaisa(lineRs))}
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>

                {trackingType === 'SERIALIZED' ? (
                  <div className='space-y-4 rounded-lg bg-muted/40 p-3 sm:p-4'>
                    <h4 className='text-lg font-semibold tracking-tight'>
                      {t('dukaan.purchase.phoneUnitsTitle')}
                    </h4>

                    {units.map((unit, unitIdx) => (
                      <div
                        key={unitIdx}
                        className='space-y-3 border-t border-border/60 pt-4 first:border-t-0 first:pt-0'
                      >
                        <p className='text-base font-semibold leading-snug'>
                          {productLabel
                            ? t('dukaan.purchase.phoneUnitForProduct', {
                                product: productLabel,
                                n: unitIdx + 1
                              })
                            : t('dukaan.purchase.phoneUnitNumber', { n: unitIdx + 1 })}
                        </p>
                        <div className='grid gap-3 sm:grid-cols-3'>
                          <form.AppField
                            name={`lines[${index}].phone_units[${unitIdx}].imei1`}
                            children={(subField) => (
                              <subField.TextField
                                label={t('dukaan.purchase.imei1')}
                                maxLength={INPUT_LIMITS.imei}
                                required
                                placeholder={t('dukaan.purchase.imei1Placeholder')}
                              />
                            )}
                          />
                          <form.AppField
                            name={`lines[${index}].phone_units[${unitIdx}].imei2`}
                            children={(subField) => (
                              <subField.TextField
                                label={t('dukaan.purchase.imei2')}
                                maxLength={INPUT_LIMITS.imei}
                                required
                                placeholder={t('dukaan.purchase.imei2Placeholder')}
                              />
                            )}
                          />
                          <form.AppField
                            name={`lines[${index}].phone_units[${unitIdx}].condition`}
                            children={(subField) => (
                              <subField.SelectField
                                label={t('dukaan.purchase.condition')}
                                options={[
                                  {
                                    label: t('dukaan.purchase.conditionNew'),
                                    value: 'NEW'
                                  },
                                  {
                                    label: t('dukaan.purchase.conditionUsed'),
                                    value: 'USED'
                                  }
                                ]}
                              />
                            )}
                          />
                        </div>
                        {unit.condition === 'USED' ? (
                          <div className='grid gap-3 sm:grid-cols-2'>
                            {isAppleBrandName(brandName) ? (
                              <form.AppField
                                name={`lines[${index}].phone_units[${unitIdx}].battery_health`}
                                children={(subField) => (
                                  <subField.TextField
                                    label={t('dukaan.purchase.batteryHealth')}
                                    type='number'
                                    min={1}
                                    max={100}
                                    placeholder={t(
                                      'dukaan.purchase.batteryHealthPlaceholder'
                                    )}
                                  />
                                )}
                              />
                            ) : null}
                            <form.AppField
                              name={`lines[${index}].phone_units[${unitIdx}].asking_price`}
                              children={(subField) => (
                                <subField.TextField
                                  label={t('dukaan.purchase.askingPrice')}
                                  type='number'
                                  min={0}
                                  max={INPUT_LIMITS.amountRupeesMax}
                                  placeholder={t(
                                    'dukaan.purchase.askingPricePlaceholder'
                                  )}
                                />
                              )}
                            />
                            <form.AppField
                              name={`lines[${index}].phone_units[${unitIdx}].defect_notes`}
                              children={(subField) => (
                                <subField.TextField
                                  label={t('dukaan.purchase.defectNotes')}
                                  maxLength={500}
                                  placeholder={t(
                                    'dukaan.purchase.defectNotesPlaceholder'
                                  )}
                                />
                              )}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}

                    {units.length === 0 ? (
                      <p className='text-muted-foreground text-sm'>
                        {t('dukaan.purchase.setQtyForUnits')}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          );
        }}
      />
    );
  }
});
