"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useT } from "@/i18n/use-t";
import { useRouter } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/lib/form";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { isFieldMetaInvalid } from "@/lib/form-context";
import { isValidationApiError } from "@/lib/api/is-validation-error";
import type { ProductImageDTO } from "@/lib/api/types";
import { FormEntitySelect } from "@/components/forms/form-entity-select";
import { Icons } from "@/components/icons";

import { useCreateProduct } from "../api/mutations";
import { productsQueryKeys } from "../api/queries";
import { uploadPendingProductImages } from "../api/service";
import { createProductFormSchema } from "@/lib/products/product-schema";
import { ProductPhotoManager } from "./product-photo-manager";
import {
  emptyProductForm,
  buildProductPayload,
  getPtaOptions,
  getAuthenticityOptions,
} from "@/lib/products/product-form-defaults";
import {
  fetchCategorySelectPage,
  fetchBrandSelectPage,
} from "../api/entity-picker-fetchers";
import { isAppleBrandName } from "@/lib/device-family";
import type { NamedEntity } from "@/types";
import type { PendingProductImageFile } from "@/types/products";

export function ProductCreatePageClient() {
  const qc = useQueryClient();
  const router = useRouter();
  const t = useTranslations("dukaan.product");
  const tRoot = useT();

  const createProduct = useCreateProduct();

  const [images, setImages] = useState<ProductImageDTO[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingProductImageFile[]>(
    [],
  );
  const [formApiError, setFormApiError] = useState<string | null>(null);
  const [brandLabel, setBrandLabel] = useState("");

  const form = useAppForm({
    defaultValues: emptyProductForm(),
    validators: {
      onSubmit: createProductFormSchema(tRoot) as never,
    },
    onSubmit: ({ value }) => {
      setFormApiError(null);
      const payload = buildProductPayload(value);

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
          toast.success(t("productCreated"));
          void qc.invalidateQueries({ queryKey: productsQueryKeys.all });
          router.push("/dashboard/products");
        },
        onError: (err: Error) => {
          if (isValidationApiError(err)) {
            setFormApiError(err.message);
            return;
          }
          toast.error(err.message || t("createFailed"));
        },
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  const handleCancel = () => {
    router.push("/dashboard/products");
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

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      {formApiError ? (
        <Alert variant="destructive" className="mb-6">
          <Icons.warning />
          <AlertDescription>{formApiError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <FieldGroup className="gap-4">
            <form.AppField
              name="name"
              children={(field) => (
                <field.TextField
                  label={t("name")}
                  required
                  placeholder={t("namePlaceholder")}
                />
              )}
            />
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <form.Field
                name="categoryId"
                children={(field) => {
                  const isInvalid = isFieldMetaInvalid(field.state.meta);
                  return (
                    <FormEntitySelect
                      name={field.name}
                      label={t("category")}
                      required
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onValueChange={(id) => field.handleChange(id)}
                      isInvalid={isInvalid}
                      errors={field.state.meta.errors}
                      queryKey={["categories", "infinite-select"]}
                      fetchPage={fetchCategorySelectPage}
                      placeholder={t("selectCategory")}
                      searchPlaceholder={t("searchCategories")}
                    />
                  );
                }}
              />
              <form.Field
                name="brandId"
                children={(field) => {
                  const isInvalid = isFieldMetaInvalid(field.state.meta);
                  return (
                    <FormEntitySelect
                      name={field.name}
                      label={t("brand")}
                      required
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onValueChange={handleBrandChange}
                      isInvalid={isInvalid}
                      errors={field.state.meta.errors}
                      queryKey={["brands", "infinite-select"]}
                      fetchPage={fetchBrandSelectPage}
                      placeholder={t("selectBrand")}
                      searchPlaceholder={t("searchBrands")}
                    />
                  );
                }}
              />
            </div>

            <form.AppField
              name="trackingType"
              children={(field) => (
                <field.SelectField
                  label={t("trackingType")}
                  required
                  options={[
                    { value: "QUANTITY", label: t("quantity") },
                    { value: "SERIALIZED", label: t("serialized") },
                  ]}
                />
              )}
            />

            <div className="grid min-w-0 gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
              <form.AppField
                name="defaultPurchasePrice"
                children={(field) => (
                  <field.TextField
                    label={t("purchasePrice")}
                    type="number"
                    min={0}
                    placeholder={t("purchasePricePlaceholder")}
                  />
                )}
              />
              <form.AppField
                name="defaultSellingPrice"
                children={(field) => (
                  <field.TextField
                    label={t("sellingPrice")}
                    type="number"
                    min={0}
                    placeholder={t("sellingPricePlaceholder")}
                  />
                )}
              />
            </div>
            <p className="text-muted-foreground -mt-2 text-xs">
              {t("pricesOptionalHint")}
            </p>

            <div className="grid min-w-0 gap-4 sm:grid-cols-3">
              <form.AppField
                name="lowStockThreshold"
                children={(field) => (
                  <field.TextField
                    label={t("lowStockThreshold")}
                    type="number"
                    min={0}
                    max={INPUT_LIMITS.lowStockMax}
                    required
                    placeholder={t("lowStockThresholdPlaceholder")}
                  />
                )}
              />
              <form.AppField
                name="sku"
                children={(field) => (
                  <field.TextField
                    label={t("sku")}
                    maxLength={INPUT_LIMITS.sku}
                    placeholder={t("skuPlaceholder")}
                  />
                )}
              />
              <form.AppField
                name="barcode"
                children={(field) => (
                  <field.TextField
                    label={t("barcode")}
                    maxLength={INPUT_LIMITS.barcode}
                    placeholder={t("barcodePlaceholder")}
                  />
                )}
              />
            </div>

            <form.AppField
              name="description"
              children={(field) => (
                <field.TextareaField
                  label={t("description")}
                  maxLength={INPUT_LIMITS.description}
                  placeholder={t("descriptionPlaceholder")}
                />
              )}
            />

            <form.Subscribe
              selector={(state) => state.values.trackingType}
              children={(trackingType) => (
                <div className="space-y-4 border-t border-border/60 pt-4">
                  {trackingType === "QUANTITY" ? (
                    <form.AppField
                      name="authenticity"
                      children={(field) => (
                        <field.RadioGroupField
                          label={t("authenticity")}
                          options={getAuthenticityOptions(t)}
                        />
                      )}
                    />
                  ) : null}
                  <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                    <form.AppField
                      name="model"
                      children={(field) => (
                        <field.TextField
                          label={t("model")}
                          maxLength={INPUT_LIMITS.model}
                          placeholder={t("modelPlaceholder")}
                        />
                      )}
                    />
                    <form.AppField
                      name="color"
                      children={(field) => (
                        <field.TextField
                          label={t("color")}
                          maxLength={INPUT_LIMITS.color}
                          placeholder={t("colorPlaceholder")}
                        />
                      )}
                    />
                  </div>
                  {trackingType === "SERIALIZED" ? (
                    <>
                      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                        <form.AppField
                          name="ram"
                          children={(field) => (
                            <field.TextField
                              label={t("ram")}
                              maxLength={INPUT_LIMITS.ram}
                              placeholder={t("ramPlaceholder")}
                            />
                          )}
                        />
                        <form.AppField
                          name="storage"
                          children={(field) => (
                            <field.TextField
                              label={t("storage")}
                              maxLength={INPUT_LIMITS.storage}
                              placeholder={t("storagePlaceholder")}
                            />
                          )}
                        />
                      </div>
                      <form.AppField
                        name="ptaStatus"
                        children={(field) => (
                          <field.SelectField
                            label={t("ptaStatus")}
                            options={getPtaOptions(t, {
                              apple: isAppleBrandName(brandLabel),
                            })}
                          />
                        )}
                      />
                    </>
                  ) : null}
                </div>
              )}
            />
          </FieldGroup>
        </div>

        <div className="space-y-8 lg:col-span-1">
          <section className="space-y-3">
            <h2 className="text-base font-semibold">{t("images")}</h2>
            <ProductPhotoManager
              images={images}
              onChange={setImages}
              onAddPendingFile={handleAddPendingFile}
              onRemovePendingFile={handleRemovePendingFile}
            />
          </section>

          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-base font-semibold">{t("onlineStoreSettings")}</h2>
            <form.AppField
              name="isPublished"
              children={(field) => (
                <field.CheckboxField label={t("isPublished")} />
              )}
            />
            <form.AppField
              name="contactForPrice"
              children={(field) => (
                <field.CheckboxField label={t("contactForPrice")} />
              )}
            />
            <form.AppField
              name="publicDescription"
              children={(field) => (
                <field.TextareaField
                  label={t("publicDescription")}
                  maxLength={INPUT_LIMITS.publicDescription}
                  placeholder={t("publicDescriptionPlaceholder")}
                />
              )}
            />
          </section>

          <div className="space-y-2 border-t border-border/60 pt-6">
            <Button
              type="submit"
              className="w-full"
              disabled={createProduct.isPending}
            >
              {createProduct.isPending ? (
                <Icons.spinner className="me-2 size-4 animate-spin" />
              ) : (
                <Icons.check className="me-2 size-4" />
              )}
              {t("add")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={createProduct.isPending}
              onClick={handleCancel}
            >
              {tRoot("common.cancel")}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
