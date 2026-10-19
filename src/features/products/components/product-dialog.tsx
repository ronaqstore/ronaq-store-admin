'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useT } from '@/i18n/use-t';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { useAppForm } from '@/lib/form';
import { INPUT_LIMITS } from '@/lib/input-limits';
import { isFieldMetaInvalid } from '@/lib/form-context';
import { isValidationApiError } from '@/lib/api/is-validation-error';
import type { ProductImageDTO } from '@/lib/api/types';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { FormEntitySelect } from '@/components/forms/form-entity-select';
import { Icons } from '@/components/icons';

import { useCreateProduct, useUpdateProduct } from '../api/mutations';
import { productsQueryKeys, useProductImagesQuery } from '../api/queries';
import { uploadPendingProductImages } from '../api/service';
import { createProductFormSchema } from '@/lib/products/product-schema';
import { ProductPhotoManager } from './product-photo-manager';
import {
  emptyProductForm,
  productToForm,
  buildProductPayload,
  getPtaOptions,
  getAuthenticityOptions
} from '@/lib/products/product-form-defaults';
import {
  fetchCategorySelectPage,
  fetchBrandSelectPage
} from '../api/entity-picker-fetchers';
import { isAppleBrandName } from '@/lib/device-family';
import type { NamedEntity } from '@/types';
import type {
  ProductDialogProps,
  ProductDialogBodyProps,
  PendingProductImageFile
} from '@/types/products';

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const qc = useQueryClient();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      void qc.invalidateQueries({ queryKey: productsQueryKeys.lists() });
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {open ? (
        <ProductDialogBody
          key={product?.id ?? 'new'}
          product={product}
          onOpenChange={handleOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function ProductDialogBody({ product, onOpenChange }: ProductDialogBodyProps) {
  const qc = useQueryClient();
  const t = useTranslations('dukaan.product');
  const tRoot = useT();
  const isEdit = Boolean(product);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(product?.id ?? '');

  const { data: imagesData } = useProductImagesQuery(product?.id ?? '', undefined, {
    enabled: isEdit && !!product?.id
  });
  const [images, setImages] = useState<ProductImageDTO[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingProductImageFile[]>([]);
  const [formApiError, setFormApiError] = useState<string | null>(null);
  const [brandLabel, setBrandLabel] = useState(product?.brandName ?? '');

  useEffect(() => {
    if (imagesData?.items) {
      setImages(imagesData.items);
    }
  }, [imagesData]);

  const form = useAppForm({
    defaultValues: product ? productToForm(product) : emptyProductForm(),
    validators: {
      onSubmit: createProductFormSchema(tRoot) as never
    },
    onSubmit: ({ value }) => {
      setFormApiError(null);
      const payload = buildProductPayload(value);

      if (product) {
        updateProduct.mutate(payload, {
          onSuccess: () => {
            void qc.invalidateQueries({ queryKey: productsQueryKeys.all });
            onOpenChange(false);
          },
          onError: (err: Error) => {
            if (isValidationApiError(err)) {
              setFormApiError(err.message);
              return;
            }
            toast.error(err.message || t('updateFailed'));
          }
        });
      } else {
        createProduct.mutate(payload, {
          onSuccess: async (data) => {
            const newId = (data as { id?: string })?.id;
            if (newId) {
              try {
                await uploadPendingProductImages(newId, images, pendingFiles);
              } catch (uploadError) {
                toast.error((uploadError as Error).message);
              }
            }
            void qc.invalidateQueries({ queryKey: productsQueryKeys.all });
            onOpenChange(false);
          },
          onError: (err: Error) => {
            if (isValidationApiError(err)) {
              setFormApiError(err.message);
              return;
            }
            toast.error(err.message || t('createFailed'));
          }
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  const handleBrandChange = (id: string, item: NamedEntity | null) => {
    form.setFieldValue('brandId', id);
    setBrandLabel(item?.name ?? '');
    const apple = isAppleBrandName(item?.name);
    const pta = form.getFieldValue('ptaStatus');
    if (!apple && pta && !['PTA_APPROVED', 'NON_PTA'].includes(pta)) {
      form.setFieldValue('ptaStatus', null);
    }
  };

  return (
    <DialogContent className='left-1/2 top-4 flex max-h-[calc(100dvh-2rem)] w-full -translate-x-1/2 translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl'>
      <DialogHeader className='shrink-0 border-b bg-popover px-6 py-4 pe-12'>
        <DialogTitle>{isEdit ? t('editTitle') : t('addTitle')}</DialogTitle>
      </DialogHeader>
      <form className='flex min-h-0 flex-1 flex-col overflow-hidden' onSubmit={handleSubmit}>
        <div className='flex-1 overflow-y-auto overscroll-contain px-6 py-4'>
          {formApiError ? (
            <Alert variant='destructive' className='mb-4'>
              <Icons.warning />
              <AlertDescription>{formApiError}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup className='gap-4'>
            <form.AppField
              name='name'
              children={(field) => (
                <field.TextField label={t('name')} required placeholder={t('namePlaceholder')} />
              )}
            />
            <div className='grid min-w-0 gap-4 sm:grid-cols-2'>
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
                      queryKey={['categories', 'infinite-select']}
                      fetchPage={fetchCategorySelectPage}
                      selectedLabel={product?.categoryName ?? undefined}
                      extraItems={
                        product?.categoryId && product.categoryName
                          ? [{ id: product.categoryId, name: product.categoryName }]
                          : []
                      }
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
                      queryKey={['brands', 'infinite-select']}
                      fetchPage={fetchBrandSelectPage}
                      selectedLabel={product?.brandName ?? undefined}
                      extraItems={
                        product?.brandId && product.brandName
                          ? [{ id: product.brandId, name: product.brandName }]
                          : []
                      }
                      placeholder={t('selectBrand')}
                      searchPlaceholder={t('searchBrands')}
                    />
                  );
                }}
              />
            </div>

            <form.AppField
              name='trackingType'
              children={(field) => (
                <field.SelectField
                  label={t('trackingType')}
                  required
                  options={[
                    { value: 'QUANTITY', label: t('quantity') },
                    { value: 'SERIALIZED', label: t('serialized') }
                  ]}
                />
              )}
            />

            <div className='grid min-w-0 gap-4 sm:grid-cols-2'>
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

            <form.Subscribe
              selector={(state) => state.values.trackingType}
              children={(trackingType) => (
                <>
                  <div className='grid min-w-0 gap-4 sm:grid-cols-2'>
                    <form.AppField
                      name='model'
                      children={(field) => (
                        <field.TextField
                          label={t('model')}
                          maxLength={INPUT_LIMITS.model}
                          placeholder={t('modelPlaceholder')}
                        />
                      )}
                    />
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
                  </div>
                  {trackingType === 'SERIALIZED' && (
                    <>
                      <div className='grid min-w-0 gap-4 sm:grid-cols-2'>
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
                          name='storage'
                          children={(field) => (
                            <field.TextField
                              label={t('storage')}
                              maxLength={INPUT_LIMITS.storage}
                              placeholder={t('storagePlaceholder')}
                            />
                          )}
                        />
                      </div>
                      <form.AppField
                        name='ptaStatus'
                        children={(field) => (
                          <field.SelectField
                            label={t('ptaStatus')}
                            options={getPtaOptions(t, {
                              apple: isAppleBrandName(brandLabel)
                            })}
                          />
                        )}
                      />
                    </>
                  )}
                  {trackingType === 'QUANTITY' ? (
                    <form.AppField
                      name='authenticity'
                      children={(field) => (
                        <field.RadioGroupField
                          label={t('authenticity')}
                          options={getAuthenticityOptions(t)}
                        />
                      )}
                    />
                  ) : null}
                </>
              )}
            />

            <div className='grid min-w-0 gap-4 sm:grid-cols-2'>
              <form.AppField
                name='sku'
                children={(field) => (
                  <field.TextField
                    label={t('sku')}
                    maxLength={INPUT_LIMITS.sku}
                    placeholder={t('skuPlaceholder')}
                  />
                )}
              />
              <form.AppField
                name='barcode'
                children={(field) => (
                  <field.TextField
                    label={t('barcode')}
                    maxLength={INPUT_LIMITS.barcode}
                    placeholder={t('barcodePlaceholder')}
                  />
                )}
              />
            </div>
            <form.AppField
              name='lowStockThreshold'
              children={(field) => (
                <field.TextField
                  label={t('lowStockThreshold')}
                  type='number'
                  min={0}
                  max={INPUT_LIMITS.lowStockMax}
                  required
                  placeholder={t('lowStockThresholdPlaceholder')}
                />
              )}
            />
            <form.AppField
              name='description'
              children={(field) => (
                <field.TextareaField
                  label={t('description')}
                  maxLength={INPUT_LIMITS.description}
                  placeholder={t('descriptionPlaceholder')}
                />
              )}
            />

            <div className='border-t pt-4'>
              <h4 className='mb-3 text-sm font-semibold'>{t('onlineStoreSettings')}</h4>
              <form.AppField
                name='publicDescription'
                children={(field) => (
                  <field.TextareaField
                    label={t('publicDescription')}
                    maxLength={INPUT_LIMITS.publicDescription}
                    placeholder={t('publicDescriptionPlaceholder')}
                  />
                )}
              />
              <div className='mt-3 grid min-w-0 gap-4 sm:grid-cols-2'>
                <form.AppField
                  name='isPublished'
                  children={(field) => <field.CheckboxField label={t('isPublished')} />}
                />
                <form.AppField
                  name='contactForPrice'
                  children={(field) => <field.CheckboxField label={t('contactForPrice')} />}
                />
              </div>
            </div>
          </FieldGroup>

          <div className='mt-6 border-t pt-4'>
            <h4 className='mb-3 text-sm font-semibold'>{t('images')}</h4>
            <ProductPhotoManager
              productId={product?.id}
              images={images}
              onChange={setImages}
              onAddPendingFile={(file, id) => {
                setPendingFiles((prev) => [...prev, { id, file }]);
              }}
              onRemovePendingFile={(id) => {
                setPendingFiles((prev) => prev.filter((p) => p.id !== id));
              }}
            />
          </div>
        </div>
        <div className='z-10 flex shrink-0 flex-col-reverse gap-3 border-t bg-popover p-4 sm:flex-row sm:items-center sm:justify-end'>
          <DialogCancelButton
            onClick={() => onOpenChange(false)}
            disabled={createProduct.isPending || updateProduct.isPending}
          />
          <DialogPrimaryButton
            mode={isEdit ? 'edit' : 'add'}
            loading={createProduct.isPending || updateProduct.isPending}
          />
        </div>
      </form>
    </DialogContent>
  );
}
