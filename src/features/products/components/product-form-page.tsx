'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useT } from '@/i18n/use-t';
import { useRouter } from '@/i18n/navigation';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { useAppForm } from '@/lib/form';
import { INPUT_LIMITS } from '@/lib/input-limits';
import { isFieldMetaInvalid } from '@/lib/form-context';
import { isValidationApiError } from '@/lib/api/is-validation-error';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import type { ProductImageDTO } from '@/lib/api/types';
import { FormEntitySelect } from '@/components/forms/form-entity-select';
import { Icons } from '@/components/icons';

import { useCreateProduct, useUpdateProduct } from '../api/mutations';
import { productQueryOptions, productsQueryKeys, useProductImagesQuery } from '../api/queries';
import { uploadPendingProductImages } from '../api/service';
import { createProductFormSchema } from '@/lib/products/product-schema';
import {
  emptyProductForm,
  productToForm,
  buildProductPayload,
  getPtaOptions,
  getAuthenticityOptions
} from '@/lib/products/product-form-defaults';
import { ProductFormSidebar } from './product-form-sidebar';
import {
  fetchCategorySelectPage,
  fetchBrandSelectPage
} from '../api/entity-picker-fetchers';
import { isAppleBrandName } from '@/lib/device-family';
import type { NamedEntity } from '@/types';
import type {
  PendingProductImageFile,
  ProductFormBodyProps,
  ProductFormPageProps
} from '@/types/products';

export function ProductFormPageClient({ productId }: ProductFormPageProps) {
  const isEdit = Boolean(productId);
  const t = useTranslations('dukaan.product');
  const tRoot = useT();

  const productQuery = useQuery({
    ...productQueryOptions(productId ?? ''),
    enabled: isEdit
  });

  if (isEdit && productQuery.isLoading) {
    return (
      <div className='text-muted-foreground flex items-center gap-2 py-12 text-sm'>
        <Icons.spinner className='size-4 animate-spin' />
        {tRoot('common.loading')}
      </div>
    );
  }

  if (isEdit && (productQuery.isError || !productQuery.data)) {
    return (
      <Alert variant='destructive'>
        <Icons.warning />
        <AlertDescription>
          {productQuery.error instanceof Error
            ? productQuery.error.message
            : t('updateFailed')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ProductFormBody
      key={productId ?? 'new'}
      productId={productId}
      product={productQuery.data ?? null}
    />
  );
}

function ProductFormBody({ productId, product }: ProductFormBodyProps) {
  const isEdit = Boolean(product);
  const qc = useQueryClient();
  const router = useRouter();
  const t = useTranslations('dukaan.product');
  const tRoot = useT();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(productId ?? '');

  const { data: imagesData } = useProductImagesQuery(productId ?? '', undefined, {
    enabled: isEdit && !!productId
  });
  const [images, setImages] = useState<ProductImageDTO[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingProductImageFile[]>([]);
  const [formApiError, setFormApiError] = useState<string | null>(null);
  const [brandLabel, setBrandLabel] = useState(product?.brandName ?? '');

  useEffect(() => {
    if (imagesData?.items) setImages(imagesData.items);
  }, [imagesData]);

  const form = useAppForm({
    defaultValues: product ? productToForm(product) : emptyProductForm(),
    validators: { onSubmit: createProductFormSchema(tRoot) as never },
    onSubmit: ({ value }) => {
      setFormApiError(null);
      const payload = buildProductPayload(value);

      if (product && productId) {
        updateProduct.mutate(payload, {
          onSuccess: () => {
            void qc.invalidateQueries({ queryKey: productsQueryKeys.all });
            router.push('/dashboard/products');
            toastSuccessAfterClose(t('productUpdated'));
          },
          onError: (err: Error) => {
            if (isValidationApiError(err)) {
              setFormApiError(err.message);
              return;
            }
            toast.error(err.message || t('updateFailed'));
          }
        });
        return;
      }

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
          router.push('/dashboard/products');
          toastSuccessAfterClose(t('productCreated'));
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
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  const handleCancel = () => {
    router.push('/dashboard/products');
  };

  const handleAddPendingFile = (file: File, id: string) => {
    setPendingFiles((prev) => [...prev, { id, file }]);
  };

  const handleRemovePendingFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.id !== id));
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

  const saving = createProduct.isPending || updateProduct.isPending;

  return (
    <form className='w-full' onSubmit={handleSubmit}>
      {formApiError ? (
        <Alert variant='destructive' className='mb-6'>
          <Icons.warning />
          <AlertDescription>{formApiError}</AlertDescription>
        </Alert>
      ) : null}

      <div className='grid grid-cols-1 items-start gap-8 lg:grid-cols-3'>
        <div className='space-y-8 lg:col-span-2'>
          <FieldGroup className='gap-4'>
            <form.AppField
              name='name'
              children={(field) => (
                <field.TextField
                  label={t('name')}
                  required
                  placeholder={t('namePlaceholder')}
                />
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

            <div className='grid min-w-0 gap-4 border-t border-border/60 pt-4 sm:grid-cols-2'>
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
            <p className='text-muted-foreground -mt-2 text-xs'>{t('pricesOptionalHint')}</p>

            <div className='grid min-w-0 gap-4 sm:grid-cols-3'>
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
              name='description'
              children={(field) => (
                <field.TextareaField
                  label={t('description')}
                  maxLength={INPUT_LIMITS.description}
                  placeholder={t('descriptionPlaceholder')}
                />
              )}
            />

            <div className='space-y-4 border-t border-border/60 pt-4'>
              <form.AppField
                name='authenticity'
                children={(field) => (
                  <field.RadioGroupField
                    label={t('authenticity')}
                    options={getAuthenticityOptions(t)}
                  />
                )}
              />
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
              <form.Subscribe
                selector={(state) => state.values.trackingType}
                children={(trackingType) =>
                  trackingType === 'SERIALIZED' ? (
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
                  ) : null
                }
              />
            </div>
          </FieldGroup>
        </div>

        <ProductFormSidebar
          productId={productId}
          images={images}
          onImagesChange={setImages}
          onAddPendingFile={handleAddPendingFile}
          onRemovePendingFile={handleRemovePendingFile}
          saving={saving}
          isEdit={isEdit}
          onCancel={handleCancel}
          labels={{
            images: t('images'),
            onlineStoreSettings: t('onlineStoreSettings'),
            add: t('add'),
            save: tRoot('common.save'),
            cancel: tRoot('common.cancel')
          }}
          fields={{
            isPublished: (
              <form.AppField
                name='isPublished'
                children={(field) => <field.CheckboxField label={t('isPublished')} />}
              />
            ),
            contactForPrice: (
              <form.AppField
                name='contactForPrice'
                children={(field) => <field.CheckboxField label={t('contactForPrice')} />}
              />
            ),
            publicDescription: (
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
            )
          }}
        />
      </div>
    </form>
  );
}
