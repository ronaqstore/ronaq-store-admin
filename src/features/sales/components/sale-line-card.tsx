'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormEntitySelect } from '@/components/forms/form-entity-select';
import { useT } from '@/i18n/use-t';
import { withForm } from '@/lib/form';
import { isFieldMetaInvalid } from '@/lib/form-context';
import { INPUT_LIMITS } from '@/lib/input-limits';
import { fromPaisa } from '@/lib/dukaan/numbers';
import { listProducts } from '@/features/products/api/service';
import { mapProductToPicker, toPickerPage } from '@/lib/api/picker';
import { isPhoneSaleLine } from '../helpers/sale-create-helpers';
import { SaleLineImeiField } from './sale-line-imei-field';
import type { PickerFetchFilters, ProductPickerItem } from '@/types/picker';
import type { SubFieldApi } from '@/types/forms';
import type { SaleFormValues, SaleUnitPriceHint } from '@/types/sales';
import { EMPTY_FORM_NUMBER } from '@/types/common';

const emptyDefaults: SaleFormValues = {
  customer_id: '__walkin__',
  discount: EMPTY_FORM_NUMBER,
  paid_now: EMPTY_FORM_NUMBER,
  notes: '',
  lines: []
};

export const SaleLineCard = withForm({
  defaultValues: emptyDefaults,
  props: {
    index: 0,
    canRemove: false,
    onRemove: (() => undefined) as () => void,
    excludedUnitIds: [] as string[]
  },
  render: function SaleLineCardRender({
    form,
    index,
    canRemove,
    onRemove,
    excludedUnitIds
  }) {
    const t = useT();

    const handleProductSelect = (
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
        `lines[${index}].unit_price`,
        product ? fromPaisa(product.default_selling_price) : EMPTY_FORM_NUMBER
      );
      form.setFieldValue(`lines[${index}].tracking_type`, trackingType ?? undefined);
      form.setFieldValue(`lines[${index}].inventory_unit_id`, '');
      form.setFieldValue(`lines[${index}].unit_condition`, undefined);
      form.setFieldValue(`lines[${index}].warranty_days`, '');
      form.setFieldValue(
        `lines[${index}].authenticity`,
        isPhone ? null : (product?.authenticity ?? null)
      );
      form.setFieldValue(`lines[${index}].quantity`, 1);
    };

    const handleImeiChange = (
      subField: SubFieldApi,
      unitId: string,
      condition?: 'NEW' | 'USED',
      currentWarrantyDays?: string,
      unit?: SaleUnitPriceHint
    ) => {
      subField.handleChange(unitId);
      form.setFieldValue(`lines[${index}].unit_condition`, condition);
      form.setFieldValue(
        `lines[${index}].warranty_days`,
        condition === 'USED' ? currentWarrantyDays || '' : ''
      );
      if (unit?.effectivePrice != null) {
        form.setFieldValue(`lines[${index}].unit_price`, fromPaisa(unit.effectivePrice));
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
      <form.Subscribe
        selector={(s) => {
          const current = s.values.lines[index];
          return {
            isPhone: isPhoneSaleLine(current),
            productId: current?.product_id ?? '',
            authenticity: current?.authenticity ?? null,
            unitCondition: current?.unit_condition,
            warrantyDays: current?.warranty_days ?? ''
          };
        }}
        children={({
          isPhone,
          productId,
          authenticity,
          unitCondition,
          warrantyDays
        }) => (
          <div className='relative grid gap-2 rounded-lg border p-3 pe-24 md:grid-cols-4'>
            {canRemove && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute inset-e-2 top-2 h-7 text-muted-foreground hover:text-destructive'
                onClick={onRemove}
              >
                <Icons.trash className='me-1 h-4 w-4' />
                {t('common.remove')}
              </Button>
            )}
            <div className='md:col-span-2'>
              <form.Field
                name={`lines[${index}].product_id`}
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
                        handleProductSelect(subField, id, product)
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
              name={`lines[${index}].quantity`}
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
              name={`lines[${index}].unit_price`}
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
                  name={`lines[${index}].inventory_unit_id`}
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
                    name={`lines[${index}].warranty_days`}
                    children={(subField) => (
                      <subField.RadioGroupField
                        label={t('dukaan.sale.shopWarranty')}
                        required
                        description={t('dukaan.sale.shopWarrantyHelp')}
                        options={[
                          {
                            value: '1',
                            label: t('dukaan.sale.warrantyDays', { days: 1 })
                          },
                          {
                            value: '2',
                            label: t('dukaan.sale.warrantyDays', { days: 2 })
                          },
                          {
                            value: '3',
                            label: t('dukaan.sale.warrantyDays', { days: 3 })
                          }
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
  }
});
