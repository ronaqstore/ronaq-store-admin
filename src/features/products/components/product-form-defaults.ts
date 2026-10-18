import { fromPaisa } from '@/lib/dukaan/numbers';
import type { ProductDTO } from '@/lib/api/types';
import type { ProductFormValues } from '../schemas/product-schema';

export function emptyProductForm(): ProductFormValues {
  return {
    name: '',
    categoryId: '',
    brandId: '',
    trackingType: 'QUANTITY',
    defaultPurchasePrice: 0,
    defaultSellingPrice: 0,
    lowStockThreshold: 5,
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
    ptaStatus: null
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
    ptaStatus: product.ptaStatus ?? null
  };
}
