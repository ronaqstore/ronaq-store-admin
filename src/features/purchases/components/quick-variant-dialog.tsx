'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { Icons } from '@/components/icons';
import { FormEntitySelect } from '@/components/forms/form-entity-select';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { useAppForm } from '@/lib/form';
import { isFieldMetaInvalid } from '@/lib/form-context';
import { INPUT_LIMITS } from '@/lib/input-limits';
import { isValidationApiError } from '@/lib/api/is-validation-error';
import { mapProductToPicker } from '@/lib/api/picker';
import { AppError } from '@/lib/errors';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import {
  buildProductPayload,
  emptyProductForm,
  getAuthenticityOptions,
  getPtaOptions
} from '@/lib/products/product-form-defaults';
import { createProductFormSchema } from '@/lib/products/product-schema';
import { useT } from '@/i18n/use-t';
import { createProduct, getProduct } from '@/features/products/api/service';
import { productsQueryKeys } from '@/features/products/api/queries';
import {
  fetchBrandSelectPage,
  fetchCategorySelectPage
} from '@/features/products/api/entity-picker-fetchers';
import type { NamedEntity } from '@/types/forms';
import type {
  QuickVariantDialogBodyProps,
  QuickVariantDialogProps,
  SuggestVariantNameParts
} from '@/types/purchases';

function suggestVariantName(parts: SuggestVariantNameParts): string {
  const chunks: string[] = [];
  if (parts.model?.trim()) chunks.push(parts.model.trim());
  else if (parts.brandLabel?.trim()) chunks.push(parts.brandLabel.trim());
  return chunks.join(' · ');
}

export function QuickVariantDialog({ open, onOpenChange, onCreated }: QuickVariantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <QuickVariantDialogBody onOpenChange={onOpenChange} onCreated={onCreated} /> : null}
    </Dialog>
  );
}

function QuickVariantDialogBody({ onOpenChange, onCreated }: QuickVariantDialogBodyProps) {
  const t = useTranslations('dukaan.product');
  const tRoot = useT();
  const qc = useQueryClient();
  const [formApiError, setFormApiError] = useState<string | null>(null);
  const [brandLabel, setBrandLabel] = useState('');
  const [nameTouched, setNameTouched] = useState(false);

  const create = useMutation({
    mutationFn: createProduct
  });

  const form = useAppForm({
    defaultValues: {
      ...emptyProductForm(),
      trackingType: 'SERIALIZED' as const,
      isPublished: true,
      lowStockThreshold: 1
    },
    validators: { onSubmit: createProductFormSchema(tRoot) as never },
    onSubmit: async ({ value }) => {
      setFormApiError(null);
      try {
        const payload = buildProductPayload(value, 'create');
        const res = await create.mutateAsync(payload);
        const id = res.id;
        if (!id) {
          throw new AppError(t('createFailed'));
        }
        const product = await getProduct(id);
        void qc.invalidateQueries({ queryKey: productsQueryKeys.all });
        void qc.invalidateQueries({ queryKey: ['products', 'picker'] });
        onCreated(mapProductToPicker(product));
        onOpenChange(false);
        toastSuccessAfterClose(t('productCreated'));
      } catch (err) {
        if (isValidationApiError(err)) {
          setFormApiError(err.message);
          return;
        }
        toast.error(err instanceof Error ? err.message : t('createFailed'));
      }
    }
  });

  const model = form.state.values.model ?? '';
  const color = form.state.values.color ?? '';
  const storage = form.state.values.storage ?? '';
  const ptaStatus = form.state.values.ptaStatus;
  const authenticity = form.state.values.authenticity ?? '';
  const trackingType = form.state.values.trackingType;

  const suggestedName = useMemo(
    () =>
      suggestVariantName({
        brandLabel,
        model,
        color,
        storage,
        ptaStatus,
        authenticity,
        trackingType
      }),
    [brandLabel, model, color, storage, ptaStatus, authenticity, trackingType]
  );

  useEffect(() => {
    if (!nameTouched && suggestedName) {
      form.setFieldValue('name', suggestedName);
    }
  }, [suggestedName, nameTouched, form]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void form.handleSubmit();
  };

  const handleBrandChange = (id: string, item: NamedEntity | null) => {
    form.setFieldValue('brandId', id);
    setBrandLabel(item?.name ?? '');
    const apple = (item?.name ?? '').trim().toLowerCase() === 'apple';
    const pta = form.getFieldValue('ptaStatus');
    if (!apple && pta && !['PTA_APPROVED', 'NON_PTA'].includes(pta)) {
      form.setFieldValue('ptaStatus', null);
    }
  };

  const handleMarkNameTouched = () => {
    setNameTouched(true);
  };

  return (
    <DialogContent className='flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg'>
      <DialogHeader className='shrink-0 px-4 pt-4 pe-12'>
        <DialogTitle>{tRoot('dukaan.purchase.quickVariantTitle')}</DialogTitle>
      </DialogHeader>
      <form className='flex min-h-0 flex-1 flex-col' onSubmit={handleSubmit}>
        <div className='no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4'>
          {formApiError ? (
            <Alert variant='destructive' className='mb-4'>
              <Icons.warning />
              <AlertDescription>{formApiError}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup className='gap-3'>
            <form.AppField
              name='name'
              children={(field) => (
                <field.TextField
                  label={t('name')}
                  required
                  maxLength={INPUT_LIMITS.nameLong}
                  placeholder={t('namePlaceholder')}
                  onFocus={handleMarkNameTouched}
                />
              )}
            />
            <form.AppField
              name='trackingType'
              children={(field) => (
                <field.SelectField
                  label={t('trackingType')}
                  required
                  options={[
                    { value: 'SERIALIZED', label: t('serialized') },
                    { value: 'QUANTITY', label: t('quantity') }
                  ]}
                />
              )}
            />
            <form.Field
              name='categoryId'
              children={(field) => {
                const isInvalid = isFieldMetaInvalid(field.state.meta);
                return (
                  <FormEntitySelect
                    name={field.name}
                    label={t('category')}
                    required
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onValueChange={(id) => field.handleChange(id)}
                    isInvalid={isInvalid}
                    errors={field.state.meta.errors}
                    queryKey={['categories', 'picker']}
                    fetchPage={fetchCategorySelectPage}
                    placeholder={t('selectCategory')}
                    searchPlaceholder={t('searchCategories')}
                  />
                );
              }}
            />
            <form.Field
              name='brandId'
              children={(field) => {
                const isInvalid = isFieldMetaInvalid(field.state.meta);
                return (
                  <FormEntitySelect
                    name={field.name}
                    label={t('brand')}
                    required
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onValueChange={handleBrandChange}
                    isInvalid={isInvalid}
                    errors={field.state.meta.errors}
                    queryKey={['brands', 'picker']}
                    fetchPage={fetchBrandSelectPage}
                    placeholder={t('selectBrand')}
                    searchPlaceholder={t('searchBrands')}
                  />
                );
              }}
            />
            <form.AppField
              name='model'
              children={(field) => (
                <field.TextField
                  label={t('model')}
                  maxLength={INPUT_LIMITS.model}
                  placeholder={tRoot('dukaan.purchase.modelPlaceholder')}
                />
              )}
            />
            <div className='grid gap-3 sm:grid-cols-2'>
              <form.AppField
                name='color'
                children={(field) => (
                  <field.TextField
                    label={t('color')}
                    maxLength={INPUT_LIMITS.color}
                    placeholder={t('colorPlaceholder')}
                  />
                )}
              />
              <form.Subscribe
                selector={(s) => s.values.trackingType}
                children={(tt) =>
                  tt === 'SERIALIZED' ? (
                    <form.AppField
                      name='storage'
                      children={(field) => (
                        <field.TextField
                          label={t('storage')}
                          maxLength={INPUT_LIMITS.storage}
                          placeholder={t('storagePlaceholder')}
                        />
                      )}
                    />
                  ) : (
                    <div />
                  )
                }
              />
            </div>
            <form.AppField
              name='authenticity'
              children={(field) => (
                <field.RadioGroupField
                  label={t('authenticity')}
                  options={getAuthenticityOptions(t)}
                />
              )}
            />
            <form.Subscribe
              selector={(s) => s.values.trackingType}
              children={(tt) =>
                tt === 'SERIALIZED' ? (
                  <>
                    <form.AppField
                      name='ram'
                      children={(field) => (
                        <field.TextField
                          label={t('ram')}
                          maxLength={INPUT_LIMITS.ram}
                          placeholder={t('ramPlaceholder')}
                        />
                      )}
                    />
                    <form.AppField
                      name='ptaStatus'
                      children={(field) => (
                        <field.SelectField
                          label={t('ptaStatus')}
                          options={getPtaOptions(t, {
                            apple: brandLabel.toLowerCase() === 'apple'
                          })}
                        />
                      )}
                    />
                  </>
                ) : null
              }
            />
            <div className='grid gap-3 sm:grid-cols-2'>
              <form.AppField
                name='defaultPurchasePrice'
                children={(field) => (
                  <field.TextField
                    label={t('purchasePrice')}
                    type='number'
                    min={0}
                    placeholder={t('purchasePricePlaceholder')}
                  />
                )}
              />
              <form.AppField
                name='defaultSellingPrice'
                children={(field) => (
                  <field.TextField
                    label={t('sellingPrice')}
                    type='number'
                    min={0}
                    placeholder={t('sellingPricePlaceholder')}
                  />
                )}
              />
            </div>
          </FieldGroup>
        </div>
        <DialogFooter className='mx-0 mb-0 shrink-0 gap-2 sm:gap-2.5'>
          <DialogCancelButton onClick={() => onOpenChange(false)} disabled={create.isPending} />
          <DialogPrimaryButton mode='add' loading={create.isPending} />
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
