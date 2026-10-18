'use client';

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
import type { PurchaseLineDraft } from '@/types/purchases';
import type { PickerFetchFilters, ProductPickerItem } from '@/types';
import type { SubFieldApi } from '@/types/forms';

const emptyDefaults = {
  supplier_id: '',
  supplier_invoice_ref: '',
  is_opening_stock: false,
  paid_now: 0,
  lines: [] as PurchaseLineDraft[]
};

export const PurchaseLineCard = withForm({
  defaultValues: emptyDefaults,
  props: {
    index: 0,
    canRemove: false,
    onRemove: () => undefined
  },
  render: function PurchaseLineCardRender({ form, index, canRemove, onRemove }) {
    const t = useT();

    const handleProductSelect = (
      subField: SubFieldApi,
      id: string,
      product: ProductPickerItem | null
    ) => {
      subField.handleChange(id);
      form.setFieldValue(
        `lines[${index}].unit_cost`,
        product ? fromPaisa(product.default_purchase_price) : 0
      );
      form.setFieldValue(`lines[${index}].tracking_type`, product?.tracking_type);
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
      <div className='overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs'>
        <div className='flex items-center justify-between gap-3 border-b border-border/60 bg-muted/40 px-3 py-2'>
          <p className='text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
            {t('dukaan.purchase.lineNumber', { n: index + 1 })}
          </p>
          {canRemove ? (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-7 px-2 text-muted-foreground hover:text-destructive'
              onClick={onRemove}
            >
              <Icons.trash className='me-1 size-3.5' />
              {t('common.remove')}
            </Button>
          ) : null}
        </div>

        <div className='space-y-3 p-3'>
          <form.Field
            name={`lines[${index}].product_id`}
            children={(subField) => {
              const isInvalid = isFieldMetaInvalid(subField.state.meta);
              return (
                <FormEntitySelect<ProductPickerItem>
                  name={subField.name}
                  label={t('dukaan.purchase.product')}
                  required
                  value={subField.state.value}
                  onBlur={subField.handleBlur}
                  onValueChange={(id, product) => handleProductSelect(subField, id, product)}
                  isInvalid={isInvalid}
                  errors={subField.state.meta.errors}
                  queryKey={['products', 'picker']}
                  fetchPage={fetchProductPage}
                  placeholder={t('dukaan.purchase.product')}
                  searchPlaceholder={t('dukaan.purchase.searchProducts')}
                />
              );
            }}
          />

          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            <form.Subscribe
              selector={(s) => s.values.lines[index]?.tracking_type}
              children={(trackingType) => (
                <form.AppField
                  name={`lines[${index}].quantity`}
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
                    />
                  )}
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
                    <p className='mb-1.5 text-sm font-medium'>{t('dukaan.purchase.lineHeader')}</p>
                    <div className='flex h-9 items-center rounded-lg border border-border/70 bg-muted/30 px-3 text-sm font-semibold tabular-nums'>
                      {formatPkr(toPaisa(lineRs))}
                    </div>
                  </div>
                );
              }}
            />
          </div>

          <form.Subscribe
            selector={(s) => s.values.lines[index]?.tracking_type}
            children={(trackingType) =>
              trackingType === 'SERIALIZED' ? (
                <div className='space-y-3 border-t border-border/50 pt-3'>
                  <form.AppField
                    name={`lines[${index}].imeis_text`}
                    children={(subField) => (
                      <subField.TextareaField
                        label={t('dukaan.purchase.imei1List')}
                        placeholder={t('dukaan.purchase.imeiHelp')}
                        rows={4}
                        maxLength={INPUT_LIMITS.imeiList}
                        required
                      />
                    )}
                  />
                  <div className='max-w-xs'>
                    <form.AppField
                      name={`lines[${index}].condition`}
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
                </div>
              ) : null
            }
          />
        </div>
      </div>
    );
  }
});
