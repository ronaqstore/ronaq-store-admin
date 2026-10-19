import type { PaginatedResponse, ProductDTO, SupplierDTO } from '@/lib/api/types';
import type { Paginated } from '@/lib/dukaan';
import type { ProductPickerItem, SupplierPickerItem } from '@/types/picker';

export function toTitleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => {
      if (!word || word === '·') return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function formatProductPickerName(product: ProductDTO): string {
  const bits = [
    product.color?.trim(),
    product.storage?.trim(),
    product.ram?.trim(),
    product.ptaStatus?.replaceAll('_', ' '),
    product.authenticity ?? null
  ].filter(Boolean) as string[];
  const label =
    bits.length === 0 ? product.name : `${product.name} · ${bits.join(' · ')}`;
  return toTitleCase(label);
}

export function mapProductToPicker(product: ProductDTO): ProductPickerItem {
  return {
    id: product.id,
    name: formatProductPickerName(product),
    is_active: product.isActive,
    tracking_type: product.trackingType,
    default_selling_price: product.defaultSellingPrice,
    default_purchase_price: product.defaultPurchasePrice,
    authenticity: product.authenticity ?? null,
    brand_name: product.brandName ?? null
  };
}

export function mapSupplierToPicker(supplier: SupplierDTO): SupplierPickerItem {
  return {
    id: supplier.id,
    name: supplier.name,
    is_active: supplier.isActive,
    cnic: supplier.cnic ?? null
  };
}

export function toPickerPage<T, R extends { id: string; name: string; is_active?: boolean }>(
  response: PaginatedResponse<T>,
  mapItem: (item: T) => R
): Paginated<R> {
  return {
    items: response.items.map(mapItem),
    total: response.total,
    page: response.page,
    limit: response.pageSize
  };
}
