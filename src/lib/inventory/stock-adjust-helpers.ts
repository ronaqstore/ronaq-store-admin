import type { InventoryItemDTO } from '@/lib/api/types';
import type { StockAdjustProductOption } from '@/types/inventory';

export function toProductOption(
  item: InventoryItemDTO,
  inStockDot: string
): StockAdjustProductOption {
  return {
    id: item.id,
    productName: item.name,
    trackingType: item.trackingType,
    inStock: item.inStock,
    name: `${item.name} · ${item.inStock} ${inStockDot} · ${item.trackingType}`
  };
}

export function toInventoryItem(option: StockAdjustProductOption): InventoryItemDTO {
  return {
    id: option.id,
    name: option.productName,
    trackingType: option.trackingType,
    inStock: option.inStock,
    stockValue: 0,
    lowStock: false
  };
}
