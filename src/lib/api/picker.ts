import type { PaginatedResponse, ProductDTO, SupplierDTO } from '@/lib/api/types';
import type { Paginated } from '@/lib/dukaan';
import type { ProductPickerItem, SupplierPickerItem } from '@/types/picker';

export function mapProductToPicker(product: ProductDTO): ProductPickerItem {
  return {
    id: product.id,
    name: product.name,
    is_active: product.isActive,
    tracking_type: product.trackingType,
    default_selling_price: product.defaultSellingPrice,
    default_purchase_price: product.defaultPurchasePrice
  };
}

export function mapSupplierToPicker(supplier: SupplierDTO): SupplierPickerItem {
  return {
    id: supplier.id,
    name: supplier.name,
    is_active: supplier.isActive
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
