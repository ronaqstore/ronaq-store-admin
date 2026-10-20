import { fromPaisa, toPaisa } from '@/lib/dukaan/numbers';
import type { ProductDTO } from '@/lib/api/types';
import type { PtaOptionsArgs } from '@/types';
import type { ProductFormValues } from '@/types/products';
import { EMPTY_FORM_NUMBER } from '@/types/common';

export function emptyProductForm(): ProductFormValues {
  return {
    name: '',
    categoryId: '',
    brandId: '',
    trackingType: 'QUANTITY',
    defaultPurchasePrice: EMPTY_FORM_NUMBER,
    defaultSellingPrice: EMPTY_FORM_NUMBER,
    lowStockThreshold: EMPTY_FORM_NUMBER,
    model: '',
    color: '',
    ram: '',
    storage: '',
    sku: '',
    barcode: '',
    description: '',
    imageUrl: '',
    isActive: true,
    isPublished: false,
    publicDescription: '',
    contactForPrice: false,
    ptaStatus: null,
    authenticity: ''
  };
}

export function productToForm(product: ProductDTO): ProductFormValues {
  return {
    name: product.name,
    categoryId: product.categoryId,
    brandId: product.brandId,
    trackingType: product.trackingType,
    defaultPurchasePrice: fromPaisa(product.defaultPurchasePrice),
    defaultSellingPrice: fromPaisa(product.defaultSellingPrice),
    lowStockThreshold: product.lowStockThreshold,
    model: product.model ?? '',
    color: product.color ?? '',
    ram: product.ram ?? '',
    storage: product.storage ?? '',
    sku: product.sku ?? '',
    barcode: product.barcode ?? '',
    description: product.description ?? '',
    imageUrl: product.imageUrl ?? '',
    isActive: product.isActive,
    isPublished: product.isPublished,
    publicDescription: product.publicDescription ?? '',
    contactForPrice: product.contactForPrice,
    ptaStatus: product.ptaStatus ?? null,
    authenticity: product.authenticity ?? ''
  };
}

export function buildProductPayload(value: ProductFormValues) {
  const cleanString = (val?: string | null) => {
    const trimmed = val?.trim();
    return trimmed ? trimmed : undefined;
  };

  return {
    name: value.name.trim(),
    categoryId: value.categoryId,
    brandId: value.brandId,
    trackingType: value.trackingType,
    defaultPurchasePrice: toPaisa(Number(value.defaultPurchasePrice ?? 0)),
    defaultSellingPrice: toPaisa(Number(value.defaultSellingPrice ?? 0)),
    lowStockThreshold: Number(value.lowStockThreshold || 0),
    model: cleanString(value.model),
    color: cleanString(value.color),
    ram: value.trackingType === 'SERIALIZED' ? cleanString(value.ram) : undefined,
    storage:
      value.trackingType === 'SERIALIZED' ? cleanString(value.storage) : undefined,
    sku: cleanString(value.sku),
    barcode: cleanString(value.barcode),
    description: cleanString(value.description),
    imageUrl: cleanString(value.imageUrl),
    isActive: value.isActive ?? true,
    isPublished: value.isPublished ?? false,
    publicDescription: cleanString(value.publicDescription),
    contactForPrice: value.contactForPrice ?? false,
    ptaStatus:
      value.trackingType === 'SERIALIZED' ? (value.ptaStatus || undefined) : undefined,
    authenticity: value.authenticity ? value.authenticity : undefined
  };
}

export function getPtaOptions(
  t: (key: string) => string,
  opts?: PtaOptionsArgs
) {
  const base = [
    { value: 'PTA_APPROVED', label: t('ptaApproved') },
    { value: 'NON_PTA', label: t('nonPta') }
  ];
  if (opts?.apple === false) return base;
  return [
    ...base,
    { value: 'JV', label: t('ptaJv') },
    { value: 'BYPASS', label: t('ptaBypass') },
    { value: 'MDM_BYPASS', label: t('ptaMdmBypass') }
  ];
}

export function getAuthenticityOptions(t: (key: string) => string) {
  return [
    { value: 'ORIGINAL', label: t('authenticityOriginal') },
    { value: 'COPY', label: t('authenticityCopy') }
  ];
}
